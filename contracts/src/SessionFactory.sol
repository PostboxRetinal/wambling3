// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {GameSession} from "./GameSession.sol";
import {GameSessionPressencial} from "./GameSessionPressencial.sol";

/// @title SessionFactory
/// @notice Permanent entry point that deploys minimal proxy sessions and collects fees.
contract SessionFactory is Ownable, ReentrancyGuard {
    using Clones for address;

    enum SessionState {
        None,
        Active,
        Finalized,
        Cancelled
    }

    enum SessionKind {
        OnChain,
        Pressencial
    }

    struct SessionInfo {
        address creator;
        uint256 stake;
        uint8 maxPlayers;
        uint256 duration;
        uint8 gameType;
        SessionKind kind;
        SessionState state;
        uint64 createdAt;
    }

    address public immutable implementation;
    address public immutable pressencialImplementation;
    address public teamWallet;
    uint256 public totalFees;

    address[] private allSessions;
    mapping(address => SessionInfo) public sessionInfo;
    mapping(address => uint256) private sessionIndex;

    event SessionCreated(
        address indexed session,
        address indexed creator,
        SessionKind kind,
        uint8 gameType,
        uint256 stake,
        uint8 maxPlayers,
        uint256 duration
    );
    event SessionFinalized(address indexed session, SessionState state, GameSession.Resolution resolution);
    event FeeReceived(address indexed from, uint256 amount);
    event FeeForwarded(address indexed from, address indexed to, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event SessionRemoved(address indexed session);
    event TeamWalletUpdated(address indexed wallet);

    error InvalidParams();
    error UnknownSession();
    error SessionNotActive();
    error SessionStillActive();
    error InvalidSessionKind();
    error NotArbiter();

    constructor() Ownable(msg.sender) {
        implementation = address(new GameSession());
        pressencialImplementation = address(new GameSessionPressencial());
        teamWallet = msg.sender;
    }

    /// @notice Deploy a new game session as a minimal proxy clone.
    function createSession(uint256 minBet, uint8 maxPlayers, uint256 duration, GameSession.GameType gameType) external returns (address session) {
        if (minBet == 0 || duration == 0 || maxPlayers != 2) revert InvalidParams();

        session = implementation.clone();
        GameSession(session).initialize(address(this), minBet, maxPlayers, duration, gameType);

        _registerSession(session, msg.sender, minBet, maxPlayers, duration, uint8(gameType), SessionKind.OnChain);
    }

    /// @notice Deploy a new in-person session as a minimal proxy clone.
    function createPressencialSession(
        uint256 stake,
        address arbiter,
        GameSessionPressencial.GameType gameType
    ) external payable returns (address session) {
        if (stake == 0 || msg.value != stake || arbiter == address(0)) revert InvalidParams();

        session = pressencialImplementation.clone();
        GameSessionPressencial(session).initialize{value: msg.value}(address(this), msg.sender, arbiter, stake, gameType);

        _registerSession(session, msg.sender, stake, 2, 0, uint8(gameType), SessionKind.Pressencial);
    }

    /// @notice Finalize a session after it has been resolved on-chain.
    function finalizeSession(address session) external {
        SessionInfo storage info = sessionInfo[session];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state != SessionState.Active) revert SessionNotActive();
        if (info.kind != SessionKind.OnChain) revert InvalidSessionKind();

        GameSession.Resolution resolution = GameSession(session).finalizeFromFactory();

        if (resolution == GameSession.Resolution.Cancel) {
            info.state = SessionState.Cancelled;
        } else {
            info.state = SessionState.Finalized;
        }

        emit SessionFinalized(session, info.state, resolution);
    }

    /// @notice Finalize an in-person session after arbiter selection.
    function finalizeSession(address session, address winner) external {
        SessionInfo storage info = sessionInfo[session];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state != SessionState.Active) revert SessionNotActive();
        if (info.kind != SessionKind.Pressencial) revert InvalidSessionKind();

        address arbiter = GameSessionPressencial(session).arbiter();
        if (msg.sender != arbiter) revert NotArbiter();

        GameSessionPressencial(session).finalizeFromFactory(winner);

        info.state = SessionState.Finalized;
        emit SessionFinalized(session, info.state, GameSession.Resolution.Winner);
    }

    /// @notice View all currently active sessions.
    function getActiveSessions() external view returns (address[] memory sessions) {
        uint256 count;
        for (uint256 i = 0; i < allSessions.length; i++) {
            if (sessionInfo[allSessions[i]].state == SessionState.Active) {
                count++;
            }
        }

        sessions = new address[](count);
        uint256 idx;
        for (uint256 i = 0; i < allSessions.length; i++) {
            if (sessionInfo[allSessions[i]].state == SessionState.Active) {
                sessions[idx++] = allSessions[i];
            }
        }
    }

    /// @notice Return all deployed sessions.
    function getAllSessions() external view returns (address[] memory) {
        return allSessions;
    }

    /// @notice Remove a non-active session from the registry.
    function removeSession(address session) external onlyOwner {
        SessionInfo storage info = sessionInfo[session];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state == SessionState.Active) revert SessionStillActive();

        uint256 index = sessionIndex[session];
        uint256 lastIndex = allSessions.length - 1;

        if (index != lastIndex) {
            address lastSession = allSessions[lastIndex];
            allSessions[index] = lastSession;
            sessionIndex[lastSession] = index;
        }

        allSessions.pop();
        delete sessionIndex[session];
        delete sessionInfo[session];

        emit SessionRemoved(session);
    }

    /// @notice Receives the 2% fee from sessions.
    function recordFee() external payable {
        _handleFee(msg.sender, msg.value);
    }

    /// @notice Withdraw accumulated fees.
    function withdrawFees(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0) || amount == 0 || amount > address(this).balance || amount > totalFees) revert InvalidParams();
        totalFees -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdraw failed");
        emit FeesWithdrawn(to, amount);
    }

    /// @notice Update the designated team wallet for pressencial fee forwarding.
    function setTeamWallet(address wallet) external onlyOwner {
        if (wallet == address(0)) revert InvalidParams();
        teamWallet = wallet;
        emit TeamWalletUpdated(wallet);
    }

    receive() external payable {
        _handleFee(msg.sender, msg.value);
    }

    function _registerSession(
        address session,
        address creator,
        uint256 stake,
        uint8 maxPlayers,
        uint256 duration,
        uint8 gameType,
        SessionKind kind
    ) internal {
        sessionInfo[session] = SessionInfo({
            creator: creator,
            stake: stake,
            maxPlayers: maxPlayers,
            duration: duration,
            gameType: gameType,
            kind: kind,
            state: SessionState.Active,
            createdAt: uint64(block.timestamp)
        });

        allSessions.push(session);
        sessionIndex[session] = allSessions.length - 1;

        emit SessionCreated(session, creator, kind, gameType, stake, maxPlayers, duration);
    }

    function _handleFee(address from, uint256 amount) internal {
        if (amount == 0) return;

        SessionInfo storage info = sessionInfo[from];
        if (info.state != SessionState.None && info.kind == SessionKind.Pressencial) {
            _forwardFee(amount);
            emit FeeForwarded(from, teamWallet, amount);
            return;
        }

        totalFees += amount;
        emit FeeReceived(from, amount);
    }

    function _forwardFee(uint256 amount) internal {
        if (teamWallet == address(0)) revert InvalidParams();
        (bool success, ) = teamWallet.call{value: amount}("");
        require(success, "Fee transfer failed");
    }
}
