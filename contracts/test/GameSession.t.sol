// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {SessionFactory} from "../src/SessionFactory.sol";
import {GameSession} from "../src/GameSession.sol";

contract GameSessionTest is Test {
    SessionFactory private factory;

    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);
    address private charlie = address(0xC0FFEE);

    uint256 private constant MIN_BET = 1 ether;
    uint8 private constant MAX_PLAYERS = 2;
    uint256 private constant DURATION = 1 days;

    function setUp() external {
        factory = new SessionFactory();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
        vm.txGasPrice(0);
    }

    function testInitializeOnlyOnce() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        vm.expectRevert(GameSession.AlreadyInitialized.selector);
        session.initialize(address(factory), MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
    }

    function testJoinRequiresMinBet() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 commit = _commit(1, keccak256("nonce"), alice, sessionAddr);
        vm.prank(alice);
        vm.expectRevert(GameSession.InvalidParams.selector);
        session.joinSession{value: MIN_BET - 1}(commit);
    }

    function testJoinRejectsDuplicatePlayer() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 commit = _commit(1, keccak256("nonce"), alice, sessionAddr);
        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commit);

        vm.prank(alice);
        vm.expectRevert(GameSession.PlayerAlreadyJoined.selector);
        session.joinSession{value: MIN_BET}(commit);
    }

    function testRevealValidatesCommitment() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 nonce = keccak256("nonce");
        bytes32 commit = _commit(1, nonce, alice, sessionAddr);
        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commit);

        vm.prank(alice);
        vm.expectRevert(GameSession.InvalidCommitment.selector);
        session.revealChoice(2, nonce);
    }

    function testResolveDrawSplitsPotMinusFee() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.RockPaperScissors);
        GameSession session = GameSession(sessionAddr);

        bytes32 nonceA = keccak256("nonceA-draw");
        bytes32 nonceB = keccak256("nonceB-draw");

        bytes32 commitA = _commit(1, nonceA, alice, sessionAddr); // Rock
        bytes32 commitB = _commit(1, nonceB, bob, sessionAddr);   // Rock

        uint256 aliceStart = alice.balance;
        uint256 bobStart = bob.balance;

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.prank(alice);
        session.revealChoice(1, nonceA);
        vm.prank(bob);
        session.revealChoice(1, nonceB);

        assertEq(uint8(session.resolution()), uint8(GameSession.Resolution.Draw));

        uint256 pot = 2 ether;
        uint256 fee = (pot * session.FEE_BPS()) / session.BPS_DENOMINATOR();
        uint256 remaining = pot - fee;
        uint256 share = remaining / 2;

        factory.finalizeSession(sessionAddr);

        assertEq(alice.balance, aliceStart - MIN_BET + share);
        assertEq(bob.balance, bobStart - MIN_BET + share);
    }

    function testTimeoutSinglePlayerWins() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 commit = _commit(1, keccak256("nonce-single"), alice, sessionAddr);
        uint256 aliceStart = alice.balance;

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commit);

        vm.warp(block.timestamp + DURATION + 1);
        session.claimTimeoutResolution();

        assertEq(uint8(session.resolution()), uint8(GameSession.Resolution.Winner));
        assertEq(session.winner(), alice);

        uint256 pot = MIN_BET;
        uint256 fee = (pot * session.FEE_BPS()) / session.BPS_DENOMINATOR();
        uint256 payout = pot - fee;

        factory.finalizeSession(sessionAddr);
        assertEq(alice.balance, aliceStart - MIN_BET + payout);
    }

    function testTimeoutNoRevealCancels() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 commitA = _commit(1, keccak256("nonceA-cancel"), alice, sessionAddr);
        bytes32 commitB = _commit(2, keccak256("nonceB-cancel"), bob, sessionAddr);

        uint256 aliceStart = alice.balance;
        uint256 bobStart = bob.balance;

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.warp(block.timestamp + DURATION + 1);
        session.claimTimeoutResolution();

        assertEq(uint8(session.resolution()), uint8(GameSession.Resolution.Cancel));

        factory.finalizeSession(sessionAddr);
        assertEq(alice.balance, aliceStart);
        assertEq(bob.balance, bobStart);
    }

    function testMaxPlayersReached() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 commitA = _commit(1, keccak256("nonceA-max"), alice, sessionAddr);
        bytes32 commitB = _commit(2, keccak256("nonceB-max"), bob, sessionAddr);
        bytes32 commitC = _commit(1, keccak256("nonceC-max"), charlie, sessionAddr);

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.prank(charlie);
        vm.expectRevert(GameSession.MaxPlayersReached.selector);
        session.joinSession{value: MIN_BET}(commitC);
    }

    function _commit(uint8 choice, bytes32 nonce, address player, address session) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(choice, nonce, player, session));
    }
}
