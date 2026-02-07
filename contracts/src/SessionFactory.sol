// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {GameSession} from "./GameSession.sol";

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

    struct SessionInfo {
        address creator;
        uint256 minBet;
        uint8 maxPlayers;
        uint256 duration;
        GameSession.GameType gameType;
        SessionState state;
        uint64 createdAt;
    }

    address public immutable implementation;
    uint256 public totalFees;

    address[] private allSessions;
    mapping(address => SessionInfo) public sessionInfo;
    mapping(address => uint256) private sessionIndex;

    event SessionCreated(address indexed session, address indexed creator, GameSession.GameType gameType, uint256 minBet, uint8 maxPlayers, uint256 duration);
    event SessionFinalized(address indexed session, SessionState state, GameSession.Resolution resolution);
    event FeeReceived(address indexed from, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event SessionRemoved(address indexed session);

    error InvalidParams();
    error UnknownSession();
    error SessionNotActive();
    error SessionStillActive();

    constructor() Ownable(msg.sender) {
        implementation = address(new GameSession());
    }

    /// @notice Deploy a new game session as a minimal proxy clone.
    function createSession(uint256 minBet, uint8 maxPlayers, uint256 duration, GameSession.GameType gameType) external returns (address session) {
        if (minBet == 0 || duration == 0 || maxPlayers != 2) revert InvalidParams();

        session = implementation.clone();
        GameSession(session).initialize(address(this), minBet, maxPlayers, duration, gameType);

        sessionInfo[session] = SessionInfo({
            creator: msg.sender,
            minBet: minBet,
            maxPlayers: maxPlayers,
            duration: duration,
            gameType: gameType,
            state: SessionState.Active,
            createdAt: uint64(block.timestamp)
        });

        allSessions.push(session);
        sessionIndex[session] = allSessions.length - 1;

        emit SessionCreated(session, msg.sender, gameType, minBet, maxPlayers, duration);
    }

    /// @notice Finalize a session after it has been resolved on-chain.
    function finalizeSession(address session) external {
        SessionInfo storage info = sessionInfo[session];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state != SessionState.Active) revert SessionNotActive();

        GameSession.Resolution resolution = GameSession(session).finalizeFromFactory();

        if (resolution == GameSession.Resolution.Cancel) {
            info.state = SessionState.Cancelled;
        } else {
            info.state = SessionState.Finalized;
        }

        emit SessionFinalized(session, info.state, resolution);
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
        totalFees += msg.value;
        emit FeeReceived(msg.sender, msg.value);
    }

    /// @notice Withdraw accumulated fees.
    function withdrawFees(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0) || amount == 0 || amount > address(this).balance || amount > totalFees) revert InvalidParams();
        totalFees -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdraw failed");
        emit FeesWithdrawn(to, amount);
    }

    receive() external payable {
        totalFees += msg.value;
        emit FeeReceived(msg.sender, msg.value);
    }
}
