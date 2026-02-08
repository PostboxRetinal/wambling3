// [AGENT-GENERATED]
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title RockPaperScissors
/// @notice Best-of-N Rock Paper Scissors with commit-reveal and external referee payout authorization.
/// @dev Referee authorization uses EIP-712 typed data signing (EIP-712).
contract RockPaperScissors is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    enum GameState {
        None,
        WaitingForOpponent,
        Committing,
        Revealing,
        AwaitingReferee,
        Paid,
        Cancelled
    }

    enum Move {
        None,
        Rock,
        Paper,
        Scissors
    }

    struct Game {
        address player1;
        address player2;
        address referee;
        address winner;
        uint256 bet;
        uint256 pot;
        uint8 bestOf;
        uint8 winsP1;
        uint8 winsP2;
        uint8 round;
        GameState state;
        bool paid;
        uint64 resolvedAt;
    }

    struct RoundData {
        bytes32 commitP1;
        bytes32 commitP2;
        Move revealP1;
        Move revealP2;
        bool revealedP1;
        bool revealedP2;
    }

    bytes32 public constant REFEREE_TYPEHASH =
        keccak256("RefereeDecision(uint256 gameId,address winner,uint256 amount,uint256 nonce)");

    uint256 public nextGameId;
    uint256 public constant REFEREE_TIMEOUT = 60;

    mapping(uint256 => Game) public games;
    mapping(uint256 => RoundData) private roundData;
    mapping(uint256 => uint256) public nonces;

    bool private initialized;

    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 bet, uint8 bestOf);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event MoveCommitted(uint256 indexed gameId, address indexed player, bytes32 commitment);
    event MoveRevealed(uint256 indexed gameId, address indexed player, Move move);
    event RoundResolved(uint256 indexed gameId, uint8 round, uint8 winsP1, uint8 winsP2);
    event GameAwaitingReferee(uint256 indexed gameId);
    event PrizeClaimed(uint256 indexed gameId, address indexed winner, uint256 amount);
    event GameResolved(uint256 indexed gameId, address indexed winner, address indexed referee);
    event GameCancelled(uint256 indexed gameId);

    error InvalidParams();
    error InvalidState();
    error NotPlayer();
    error AlreadyJoined();
    error StakeMismatch();
    error CommitmentMissing();
    error InvalidReveal();
    error InvalidSignature();
    error NotWinner();
    error RefereeTimeoutNotReached();
    error GameNotReady();

    constructor() EIP712("Wambling3 RockPaperScissors", "1") Ownable(msg.sender) {
        initialized = true;
    }

    /// @notice Initialize a clone instance (EIP-1167) with owner.
    /// @dev Can only be called once; intended for minimal proxy clones.
    function initialize(address initialOwner) external {
        if (initialized) revert InvalidState();
        if (initialOwner == address(0)) revert InvalidParams();

        initialized = true;
        _transferOwnership(initialOwner);
    }

    /// @notice Create a new best-of-N game with a bet deposit and referee.
    function createGame(uint8 bestOf, address referee) external payable returns (uint256 gameId) {
        if (bestOf == 0 || bestOf % 2 == 0) revert InvalidParams();
        if (msg.value == 0) revert InvalidParams();
        if (referee == address(0) || referee == msg.sender) revert InvalidParams();

        gameId = nextGameId++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            referee: referee,
            winner: address(0),
            bet: msg.value,
            pot: 0,
            bestOf: bestOf,
            winsP1: 0,
            winsP2: 0,
            round: 1,
            state: GameState.WaitingForOpponent,
            paid: false,
            resolvedAt: 0
        });

        emit GameCreated(gameId, msg.sender, msg.value, bestOf);
    }

    /// @notice Join a game by matching the bet.
    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        if (game.state != GameState.WaitingForOpponent) revert InvalidState();
        if (game.player1 == address(0) || game.player2 != address(0)) revert AlreadyJoined();
        if (msg.value != game.bet) revert StakeMismatch();
        if (msg.sender == game.player1) revert InvalidParams();
        if (game.referee == msg.sender) revert InvalidParams();

        game.player2 = msg.sender;
        game.pot = game.bet + msg.value;
        game.state = GameState.Committing;

        emit GameJoined(gameId, msg.sender);
    }

    /// @notice Commit a move for the current round.
    /// @dev commitment = keccak256(abi.encodePacked(uint8(move), salt)).
    function commitMove(uint256 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];
        if (game.state != GameState.Committing) revert InvalidState();
        if (commitment == bytes32(0)) revert InvalidParams();

        RoundData storage round = roundData[gameId];
        if (msg.sender == game.player1) {
            if (round.commitP1 != bytes32(0)) revert InvalidParams();
            round.commitP1 = commitment;
        } else if (msg.sender == game.player2) {
            if (round.commitP2 != bytes32(0)) revert InvalidParams();
            round.commitP2 = commitment;
        } else {
            revert NotPlayer();
        }

        emit MoveCommitted(gameId, msg.sender, commitment);

        if (round.commitP1 != bytes32(0) && round.commitP2 != bytes32(0)) {
            game.state = GameState.Revealing;
        }
    }

    /// @notice Reveal a move for the current round.
    function revealMove(uint256 gameId, Move move, bytes32 salt) external {
        Game storage game = games[gameId];
        if (game.state != GameState.Revealing) revert InvalidState();
        if (move == Move.None) revert InvalidParams();

        RoundData storage round = roundData[gameId];
        bytes32 commitment = keccak256(abi.encodePacked(uint8(move), salt));

        if (msg.sender == game.player1) {
            if (round.commitP1 == bytes32(0)) revert CommitmentMissing();
            if (round.revealedP1) revert InvalidReveal();
            if (round.commitP1 != commitment) revert InvalidReveal();
            round.revealP1 = move;
            round.revealedP1 = true;
        } else if (msg.sender == game.player2) {
            if (round.commitP2 == bytes32(0)) revert CommitmentMissing();
            if (round.revealedP2) revert InvalidReveal();
            if (round.commitP2 != commitment) revert InvalidReveal();
            round.revealP2 = move;
            round.revealedP2 = true;
        } else {
            revert NotPlayer();
        }

        emit MoveRevealed(gameId, msg.sender, move);

        if (round.revealedP1 && round.revealedP2) {
            _resolveRound(gameId, game, round);
        }
    }

    /// @notice Claim prize with referee's EIP-712 signed authorization.
    function claimPrize(uint256 gameId, bytes calldata signature) external nonReentrant {
        Game storage game = games[gameId];
        if (game.state != GameState.AwaitingReferee) revert GameNotReady();
        if (game.paid) revert InvalidState();

        if (msg.sender != game.player1 && msg.sender != game.player2) revert NotPlayer();

        if (msg.sender != game.winner) revert NotWinner();

        uint256 nonce = nonces[gameId];
        address winner = msg.sender;
        uint256 amount = game.pot;
        _verifySignature(gameId, game.referee, winner, amount, nonce, signature);

        nonces[gameId] = nonce + 1;
        game.paid = true;
        game.state = GameState.Paid;

        _sendValue(winner, amount);
        emit PrizeClaimed(gameId, winner, amount);
    }

    /// @notice Claim prize without referee signature after timeout.
    function claimPrizeTimeout(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        if (game.state != GameState.AwaitingReferee) revert GameNotReady();
        if (game.paid) revert InvalidState();
        if (msg.sender != game.winner) revert NotWinner();
        if (game.resolvedAt == 0 || block.timestamp < game.resolvedAt + REFEREE_TIMEOUT) {
            revert RefereeTimeoutNotReached();
        }

        game.paid = true;
        game.state = GameState.Paid;

        _sendValue(game.winner, game.pot);
        emit PrizeClaimed(gameId, game.winner, game.pot);
    }

    /// @notice Cancel before opponent joins.
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        if (game.state != GameState.WaitingForOpponent) revert InvalidState();
        if (msg.sender != game.player1) revert NotPlayer();

        game.state = GameState.Cancelled;
        _sendValue(game.player1, game.bet);
        emit GameCancelled(gameId);
    }

    /// @notice Read the current game state.
    function getGameState(uint256 gameId) external view returns (GameState) {
        return games[gameId].state;
    }

    function _resolveRound(uint256 gameId, Game storage game, RoundData storage round) internal {
        uint8 outcome = _decideWinner(round.revealP1, round.revealP2);
        if (outcome == 1) {
            game.winsP1 += 1;
        } else if (outcome == 2) {
            game.winsP2 += 1;
        }

        emit RoundResolved(gameId, game.round, game.winsP1, game.winsP2);

        delete roundData[gameId];
        game.round += 1;

        uint8 targetWins = uint8((game.bestOf / 2) + 1);
        if (game.winsP1 >= targetWins || game.winsP2 >= targetWins) {
            game.state = GameState.AwaitingReferee;
            game.winner = game.winsP1 >= targetWins ? game.player1 : game.player2;
            game.resolvedAt = uint64(block.timestamp);
            emit GameResolved(gameId, game.winner, game.referee);
            emit GameAwaitingReferee(gameId);
        } else {
            game.state = GameState.Committing;
        }
    }

    function _decideWinner(Move p1, Move p2) internal pure returns (uint8) {
        if (p1 == p2) return 0;
        if (p1 == Move.Rock && p2 == Move.Scissors) return 1;
        if (p1 == Move.Paper && p2 == Move.Rock) return 1;
        if (p1 == Move.Scissors && p2 == Move.Paper) return 1;
        return 2;
    }

    function _verifySignature(
        uint256 gameId,
        address referee,
        address winner,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) internal view {
        if (signature.length != 65) revert InvalidSignature();

        // Signature payload: RefereeDecision(gameId, winner, amount, nonce)
        bytes32 structHash =
            keccak256(abi.encode(REFEREE_TYPEHASH, gameId, winner, amount, nonce));
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        if (signer != referee) revert InvalidSignature();
    }

    function _sendValue(address to, uint256 amount) internal {
        if (amount == 0) return;
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
}