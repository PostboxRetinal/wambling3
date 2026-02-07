// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title GameSessionPressencial
/// @notice Escrow for in-person board game wagers with an arbiter-selected winner.
/// @dev Intended for ERC-1167 clones and initialized by a factory.
contract GameSessionPressencial is ReentrancyGuard {
    enum SessionState {
        Uninitialized,
        Created,
        Active,
        Finalized
    }

    enum GameType {
        Chess,
        Checkers
    }

    error AlreadyInitialized();
    error InvalidParams();
    error NotFactory();
    error SessionNotCreated();
    error SessionNotActive();
    error SameAsCreator();
    error StakeMismatch();
    error InvalidWinner();

    uint256 public constant FEE_BPS = 200; // 2%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    address public factory;
    address public creator;
    address public opponent;
    address public arbiter;
    uint256 public stake;
    uint256 public createdAt;
    uint256 public startedAt;
    uint256 public endedAt;
    uint256 public durationSeconds;
    address public winner;
    GameType public gameType;
    SessionState public sessionState;

    event SessionInitialized(address indexed factory, address indexed creator, address indexed arbiter, uint256 stake, GameType gameType);
    event SessionJoined(address indexed opponent, uint256 startedAt);
    event SessionFinalized(address indexed winner, uint256 payout, uint256 fee, uint256 durationSeconds);

    /// @notice Initializes a clone instance and locks the creator stake.
    function initialize(
        address factory_,
        address creator_,
        address arbiter_,
        uint256 stake_,
        GameType gameType_
    ) external payable {
        if (sessionState != SessionState.Uninitialized) revert AlreadyInitialized();
        if (factory_ == address(0) || creator_ == address(0) || arbiter_ == address(0) || stake_ == 0) revert InvalidParams();
        if (msg.value != stake_) revert StakeMismatch();

        factory = factory_;
        creator = creator_;
        arbiter = arbiter_;
        stake = stake_;
        gameType = gameType_;
        createdAt = block.timestamp;
        sessionState = SessionState.Created;

        emit SessionInitialized(factory_, creator_, arbiter_, stake_, gameType_);
    }

    /// @notice Join the session by matching the creator's stake.
    function joinSession() external payable {
        if (sessionState != SessionState.Created) revert SessionNotCreated();
        if (msg.sender == creator) revert SameAsCreator();
        if (msg.value != stake) revert StakeMismatch();

        opponent = msg.sender;
        startedAt = block.timestamp;
        sessionState = SessionState.Active;

        emit SessionJoined(msg.sender, startedAt);
    }

    /// @notice Finalize payout. Only callable by the factory after arbiter selection.
    function finalizeFromFactory(address winner_) external nonReentrant {
        if (msg.sender != factory) revert NotFactory();
        if (sessionState != SessionState.Active) revert SessionNotActive();
        if (winner_ != creator && winner_ != opponent) revert InvalidWinner();

        winner = winner_;
        endedAt = block.timestamp;
        durationSeconds = endedAt - startedAt;
        sessionState = SessionState.Finalized;

        uint256 pot = stake * 2;
        uint256 fee = (pot * FEE_BPS) / BPS_DENOMINATOR;
        uint256 payout = pot - fee;

        _recordFee(fee);
        _sendValue(winner_, payout);

        emit SessionFinalized(winner_, payout, fee, durationSeconds);
    }

    function _recordFee(uint256 amount) internal {
        if (amount == 0) return;
        (bool success, ) = factory.call{value: amount}(abi.encodeWithSignature("recordFee()"));
        require(success, "Fee transfer failed");
    }

    function _sendValue(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
