// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title GameSession
/// @notice Minimal session escrow contract intended to be deployed via ERC-1167 clones.
/// @dev Uses an initializer instead of a constructor. Only the factory can finalize payouts.
contract GameSession is ReentrancyGuard {
    enum SessionState {
        Uninitialized,
        Active,
        Resolved,
        Finalized
    }

    enum GameType {
        CoinFlip,
        RockPaperScissors
    }

    enum Resolution {
        None,
        Winner,
        Draw,
        Cancel
    }

    struct PlayerInfo {
        bool joined;
        bool revealed;
        bytes32 commitment;
        uint8 choice;
        uint256 stake;
    }

    error AlreadyInitialized();
    error NotFactory();
    error InvalidParams();
    error SessionNotActive();
    error SessionNotResolved();
    error SessionAlreadyFinalized();
    error MaxPlayersReached();
    error PlayerAlreadyJoined();
    error InvalidCommitment();
    error NotPlayer();
    error AlreadyRevealed();
    error InvalidChoice();
    error TimeoutNotReached();
    error NotEnoughPlayers();

    uint256 public constant FEE_BPS = 200; // 2%
    uint256 public constant BPS_DENOMINATOR = 10_000;

    address public factory;
    uint256 public minBet;
    uint8 public maxPlayers;
    uint256 public duration;
    uint256 public createdAt;
    GameType public gameType;
    SessionState public sessionState;
    Resolution public resolution;

    address public winner;
    bool public isDraw;

    address[] private players;
    mapping(address => PlayerInfo) public playerInfo;

    event SessionInitialized(address indexed factory, uint256 minBet, uint8 maxPlayers, uint256 duration, GameType gameType);
    event PlayerJoined(address indexed player, uint256 stake, bytes32 commitment);
    event ChoiceRevealed(address indexed player, uint8 choice);
    event SessionResolved(Resolution resolution, address indexed winner, bool isDraw);
    event SessionFinalized(Resolution resolution, address indexed winner, uint256 payout, uint256 fee);
    event RefundIssued(address indexed player, uint256 amount);

    /// @notice Initializes a clone instance.
    function initialize(
        address factory_,
        uint256 minBet_,
        uint8 maxPlayers_,
        uint256 duration_,
        GameType gameType_
    ) external {
        if (sessionState != SessionState.Uninitialized) revert AlreadyInitialized();
        if (factory_ == address(0) || minBet_ == 0 || duration_ == 0) revert InvalidParams();
        if (maxPlayers_ != 2) revert InvalidParams();

        factory = factory_;
        minBet = minBet_;
        maxPlayers = maxPlayers_;
        duration = duration_;
        gameType = gameType_;
        createdAt = block.timestamp;
        sessionState = SessionState.Active;

        emit SessionInitialized(factory_, minBet_, maxPlayers_, duration_, gameType_);
    }

    /// @notice Join the session by staking the minimum bet and submitting a commitment.
    /// @dev commitment = keccak256(abi.encodePacked(choice, nonce, player, address(this))).
    function joinSession(bytes32 commitment) external payable {
        if (sessionState != SessionState.Active) revert SessionNotActive();
        if (players.length >= maxPlayers) revert MaxPlayersReached();
        if (commitment == bytes32(0) || msg.value < minBet) revert InvalidParams();

        PlayerInfo storage info = playerInfo[msg.sender];
        if (info.joined) revert PlayerAlreadyJoined();

        info.joined = true;
        info.commitment = commitment;
        info.stake = msg.value;
        players.push(msg.sender);

        emit PlayerJoined(msg.sender, msg.value, commitment);
    }

    /// @notice Reveal your choice for the game.
    function revealChoice(uint8 choice, bytes32 nonce) external {
        if (sessionState != SessionState.Active) revert SessionNotActive();

        PlayerInfo storage info = playerInfo[msg.sender];
        if (!info.joined) revert NotPlayer();
        if (info.revealed) revert AlreadyRevealed();
        if (!_isChoiceValid(choice)) revert InvalidChoice();

        bytes32 expected = keccak256(abi.encodePacked(choice, nonce, msg.sender, address(this)));
        if (expected != info.commitment) revert InvalidCommitment();

        info.revealed = true;
        info.choice = choice;

        emit ChoiceRevealed(msg.sender, choice);

        if (_allPlayersRevealed()) {
            _resolve();
        }
    }

    /// @notice Resolve the session if the reveal deadline has passed.
    function claimTimeoutResolution() external {
        if (sessionState != SessionState.Active) revert SessionNotActive();
        if (block.timestamp < createdAt + duration) revert TimeoutNotReached();

        if (players.length == 0) revert NotEnoughPlayers();

        if (players.length == 1) {
            winner = players[0];
            resolution = Resolution.Winner;
            sessionState = SessionState.Resolved;
            emit SessionResolved(resolution, winner, false);
            return;
        }

        PlayerInfo storage p0 = playerInfo[players[0]];
        PlayerInfo storage p1 = playerInfo[players[1]];

        if (p0.revealed && !p1.revealed) {
            winner = players[0];
            resolution = Resolution.Winner;
        } else if (!p0.revealed && p1.revealed) {
            winner = players[1];
            resolution = Resolution.Winner;
        } else if (!p0.revealed && !p1.revealed) {
            resolution = Resolution.Cancel;
        } else {
            _resolve();
            return;
        }

        sessionState = SessionState.Resolved;
        emit SessionResolved(resolution, winner, resolution == Resolution.Draw);
    }

    /// @notice Finalize payout or refund. Only callable by the factory.
    function finalizeFromFactory() external nonReentrant returns (Resolution) {
        if (msg.sender != factory) revert NotFactory();
        if (sessionState == SessionState.Finalized) revert SessionAlreadyFinalized();
        if (sessionState != SessionState.Resolved) revert SessionNotResolved();

        sessionState = SessionState.Finalized;

        uint256 fee;
        uint256 payout;

        if (resolution == Resolution.Winner) {
            uint256 pot = address(this).balance;
            fee = (pot * FEE_BPS) / BPS_DENOMINATOR;
            _recordFee(fee);
            payout = pot - fee;
            _sendValue(winner, payout);
        } else if (resolution == Resolution.Draw) {
            uint256 pot = address(this).balance;
            fee = (pot * FEE_BPS) / BPS_DENOMINATOR;
            _recordFee(fee);
            uint256 remaining = pot - fee;
            uint256 share = remaining / players.length;
            uint256 remainder = remaining - (share * players.length);

            for (uint256 i = 0; i < players.length; i++) {
                _sendValue(players[i], share);
            }

            if (remainder > 0) {
                _recordFee(remainder);
            }

            payout = remaining;
            isDraw = true;
        } else if (resolution == Resolution.Cancel) {
            for (uint256 i = 0; i < players.length; i++) {
                uint256 amount = playerInfo[players[i]].stake;
                if (amount > 0) {
                    _sendValue(players[i], amount);
                    emit RefundIssued(players[i], amount);
                }
            }
        }

        emit SessionFinalized(resolution, winner, payout, fee);
        return resolution;
    }

    /// @notice Return current players list.
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    function _resolve() internal {
        if (players.length != 2) revert NotEnoughPlayers();

        PlayerInfo storage p0 = playerInfo[players[0]];
        PlayerInfo storage p1 = playerInfo[players[1]];

        if (!p0.revealed || !p1.revealed) revert NotEnoughPlayers();

        uint8 choice0 = p0.choice;
        uint8 choice1 = p1.choice;

        if (choice0 == choice1) {
            resolution = Resolution.Draw;
            isDraw = true;
        } else {
            bool player0Wins = _isPlayer0Winner(choice0, choice1);
            winner = player0Wins ? players[0] : players[1];
            resolution = Resolution.Winner;
        }

        sessionState = SessionState.Resolved;
        emit SessionResolved(resolution, winner, isDraw);
    }

    function _isPlayer0Winner(uint8 choice0, uint8 choice1) internal view returns (bool) {
        if (gameType == GameType.CoinFlip) {
            return choice0 == 1 && choice1 == 2;
        }

        if (choice0 == 1 && choice1 == 3) return true; // Rock beats Scissors
        if (choice0 == 2 && choice1 == 1) return true; // Paper beats Rock
        if (choice0 == 3 && choice1 == 2) return true; // Scissors beats Paper
        return false;
    }

    function _allPlayersRevealed() internal view returns (bool) {
        if (players.length < maxPlayers) return false;
        for (uint256 i = 0; i < players.length; i++) {
            if (!playerInfo[players[i]].revealed) {
                return false;
            }
        }
        return true;
    }

    function _isChoiceValid(uint8 choice) internal view returns (bool) {
        if (gameType == GameType.CoinFlip) {
            return choice == 1 || choice == 2; // 1 = Heads, 2 = Tails
        }
        return choice == 1 || choice == 2 || choice == 3; // 1 = Rock, 2 = Paper, 3 = Scissors
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
