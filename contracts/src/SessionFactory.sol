// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

import {RockPaperScissors} from "./RockPaperScissors.sol";

/// @title SessionFactory
/// @notice Permanent entry point that records off-chain sessions and escrows wagers.
contract SessionFactory is Ownable, ReentrancyGuard {
    using Clones for address;
    enum SessionState {
        None,
        Active,
        Finalized,
        Cancelled
    }

    enum GameType {
        CoinFlip,
        RockPaperScissors
    }

    struct SessionInfo {
        address creator;
        address opponent;
        address winner;
        uint256 stake;
        GameType gameType;
        SessionState state;
        uint64 createdAt;
    }

    uint256 public constant FEE_BPS = 200; // 2%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    uint256 public totalFees;

    address public rpsImplementation;

    bytes16[] private allSessions;
    mapping(bytes16 => SessionInfo) public sessionInfo;
    mapping(bytes16 => uint256) private sessionIndex;

    event SessionCreated(
        bytes16 indexed sessionId,
        address indexed creator,
        uint8 gameType,
        uint256 stake
    );
    event SessionJoined(bytes16 indexed sessionId, address indexed opponent);
    event SessionFinalized(bytes16 indexed sessionId, SessionState state, address winner, uint256 payout, uint256 fee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event SessionRemoved(bytes16 indexed sessionId);
    event RpsImplementationUpdated(address indexed implementation);
    event RpsCloneCreated(address indexed clone, address indexed owner, address indexed referee);

    error InvalidParams();
    error UnknownSession();
    error SessionNotActive();
    error SessionStillActive();
    error AlreadyJoined();
    error SameAsCreator();
    error StakeMismatch();
    error InvalidWinner();
    error OpponentMissing();
    error SessionAlreadyExists();
    error ImplementationNotSet();

    constructor() Ownable(msg.sender) {}

    /// @notice Set the RockPaperScissors implementation used for EIP-1167 clones.
    function setRpsImplementation(address implementation) external onlyOwner {
        if (implementation == address(0)) revert InvalidParams();
        rpsImplementation = implementation;
        emit RpsImplementationUpdated(implementation);
    }

    /// @notice Deploy an EIP-1167 clone for a RockPaperScissors game.
    /// @dev Initializes the clone with the referee and the caller as owner.
    function createRpsClone(address referee) external returns (address clone) {
        if (rpsImplementation == address(0)) revert ImplementationNotSet();
        if (referee == address(0)) revert InvalidParams();

        clone = Clones.clone(rpsImplementation);
        RockPaperScissors(clone).initialize(referee, msg.sender);

        emit RpsCloneCreated(clone, msg.sender, referee);
    }

    /// @notice Create a new off-chain session by staking the wager in escrow.
    function createSession(bytes16 sessionId, uint256 stake, GameType gameType) external payable returns (bytes16) {
        if (sessionId == bytes16(0) || stake == 0 || msg.value != stake) revert InvalidParams();
        if (sessionInfo[sessionId].state != SessionState.None) revert SessionAlreadyExists();

        sessionInfo[sessionId] = SessionInfo({
            creator: msg.sender,
            opponent: address(0),
            winner: address(0),
            stake: stake,
            gameType: gameType,
            state: SessionState.Active,
            createdAt: uint64(block.timestamp)
        });

        allSessions.push(sessionId);
        sessionIndex[sessionId] = allSessions.length - 1;

        emit SessionCreated(sessionId, msg.sender, uint8(gameType), stake);
        return sessionId;
    }

    /// @notice Join an existing session by matching the creator's stake.
    function joinSession(bytes16 sessionId) external payable {
        SessionInfo storage info = sessionInfo[sessionId];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state != SessionState.Active) revert SessionNotActive();
        if (info.opponent != address(0)) revert AlreadyJoined();
        if (msg.sender == info.creator) revert SameAsCreator();
        if (msg.value != info.stake) revert StakeMismatch();

        info.opponent = msg.sender;
        emit SessionJoined(sessionId, msg.sender);
    }

    /// @notice Finalize a session after arbiter selection.
    function finalizeSession(bytes16 sessionId, address winner) external nonReentrant onlyOwner {
        SessionInfo storage info = sessionInfo[sessionId];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state != SessionState.Active) revert SessionNotActive();
        if (info.opponent == address(0)) revert OpponentMissing();
        if (winner != info.creator && winner != info.opponent) revert InvalidWinner();

        info.state = SessionState.Finalized;
        info.winner = winner;

        uint256 pot = info.stake * 2;
        uint256 fee = (pot * FEE_BPS) / BPS_DENOMINATOR;
        uint256 payout = pot - fee;
        totalFees += fee;

        _sendValue(winner, payout);
        emit SessionFinalized(sessionId, info.state, winner, payout, fee);
    }

    /// @notice Cancel a session before an opponent joins.
    function cancelSession(bytes16 sessionId) external nonReentrant {
        SessionInfo storage info = sessionInfo[sessionId];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state != SessionState.Active) revert SessionNotActive();
        if (msg.sender != info.creator) revert InvalidParams();
        if (info.opponent != address(0)) revert AlreadyJoined();

        info.state = SessionState.Cancelled;
        info.winner = address(0);
        _sendValue(info.creator, info.stake);
        emit SessionFinalized(sessionId, info.state, address(0), info.stake, 0);
    }

    /// @notice View all currently active sessions.
    function getActiveSessions() external view returns (bytes16[] memory sessions) {
        uint256 count;
        for (uint256 i = 0; i < allSessions.length; i++) {
            if (sessionInfo[allSessions[i]].state == SessionState.Active) {
                count++;
            }
        }

        sessions = new bytes16[](count);
        uint256 idx;
        for (uint256 i = 0; i < allSessions.length; i++) {
            if (sessionInfo[allSessions[i]].state == SessionState.Active) {
                sessions[idx++] = allSessions[i];
            }
        }
    }

    /// @notice Return all deployed sessions.
    function getAllSessions() external view returns (bytes16[] memory) {
        return allSessions;
    }

    /// @notice Remove a non-active session from the registry.
    function removeSession(bytes16 sessionId) external onlyOwner {
        SessionInfo storage info = sessionInfo[sessionId];
        if (info.state == SessionState.None) revert UnknownSession();
        if (info.state == SessionState.Active) revert SessionStillActive();

        uint256 index = sessionIndex[sessionId];
        uint256 lastIndex = allSessions.length - 1;

        if (index != lastIndex) {
            bytes16 lastSession = allSessions[lastIndex];
            allSessions[index] = lastSession;
            sessionIndex[lastSession] = index;
        }

        allSessions.pop();
        delete sessionIndex[sessionId];
        delete sessionInfo[sessionId];

        emit SessionRemoved(sessionId);
    }

    /// @notice Withdraw accumulated fees.
    function withdrawFees(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0) || amount == 0 || amount > address(this).balance || amount > totalFees) revert InvalidParams();
        totalFees -= amount;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdraw failed");
        emit FeesWithdrawn(to, amount);
    }

    function _sendValue(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
