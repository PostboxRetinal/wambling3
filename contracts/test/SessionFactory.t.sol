// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {SessionFactory} from "../src/SessionFactory.sol";
import {GameSession} from "../src/GameSession.sol";

contract SessionFactoryTest is Test {
    SessionFactory private factory;

    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    uint256 private constant MIN_BET = 1 ether;
    uint8 private constant MAX_PLAYERS = 2;
    uint256 private constant DURATION = 1 days;

    function setUp() external {
        factory = new SessionFactory();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.txGasPrice(0);
    }

    function testCreateSessionRegisters() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        address creator;
        uint256 minBet;
        uint8 maxPlayers;
        uint256 duration;
        GameSession.GameType gameType;
        SessionFactory.SessionState state;
        uint64 createdAt;

        (creator, minBet, maxPlayers, duration, gameType, state, createdAt) = factory.sessionInfo(sessionAddr);
        assertEq(creator, address(this));
        assertEq(minBet, MIN_BET);
        assertEq(maxPlayers, MAX_PLAYERS);
        assertEq(duration, DURATION);
        assertEq(uint8(gameType), uint8(GameSession.GameType.CoinFlip));
        assertEq(uint8(state), uint8(SessionFactory.SessionState.Active));
        assertEq(createdAt > 0, true);

        assertEq(uint8(session.sessionState()), uint8(GameSession.SessionState.Active));
        assertEq(uint8(session.gameType()), uint8(GameSession.GameType.CoinFlip));

        address[] memory active = factory.getActiveSessions();
        assertEq(active.length, 1);
        assertEq(active[0], sessionAddr);

        address[] memory all = factory.getAllSessions();
        assertEq(all.length, 1);
        assertEq(all[0], sessionAddr);
    }

    function testJoinRevealResolveWinner() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 nonceA = keccak256("nonceA");
        bytes32 nonceB = keccak256("nonceB");
        bytes32 commitA = _commit(1, nonceA, alice, sessionAddr); // Heads
        bytes32 commitB = _commit(2, nonceB, bob, sessionAddr);   // Tails

        uint256 aliceStart = alice.balance;
        uint256 bobStart = bob.balance;

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.prank(alice);
        session.revealChoice(1, nonceA);
        vm.prank(bob);
        session.revealChoice(2, nonceB);

        assertEq(uint8(session.sessionState()), uint8(GameSession.SessionState.Resolved));
        assertEq(uint8(session.resolution()), uint8(GameSession.Resolution.Winner));
        assertEq(session.winner(), alice);

        uint256 fee = (2 ether * session.FEE_BPS()) / session.BPS_DENOMINATOR();
        uint256 payout = 2 ether - fee;

        factory.finalizeSession(sessionAddr);

        assertEq(uint8(session.sessionState()), uint8(GameSession.SessionState.Finalized));
        assertEq(factory.totalFees(), fee);
        assertEq(alice.balance, aliceStart - MIN_BET + payout);
        assertEq(bob.balance, bobStart - MIN_BET);
    }

    function testTimeoutCancelRefunds() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.RockPaperScissors);
        GameSession session = GameSession(sessionAddr);

        bytes32 nonceA = keccak256("nonceA-timeout");
        bytes32 nonceB = keccak256("nonceB-timeout");
        bytes32 commitA = _commit(1, nonceA, alice, sessionAddr);
        bytes32 commitB = _commit(2, nonceB, bob, sessionAddr);

        uint256 aliceStart = alice.balance;
        uint256 bobStart = bob.balance;

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.warp(block.timestamp + DURATION + 1);
        session.claimTimeoutResolution();

        assertEq(uint8(session.sessionState()), uint8(GameSession.SessionState.Resolved));
        assertEq(uint8(session.resolution()), uint8(GameSession.Resolution.Cancel));

        factory.finalizeSession(sessionAddr);

        assertEq(uint8(session.sessionState()), uint8(GameSession.SessionState.Finalized));
        assertEq(alice.balance, aliceStart);
        assertEq(bob.balance, bobStart);
    }

    function testWithdrawFees() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 nonceA = keccak256("nonceA-withdraw");
        bytes32 nonceB = keccak256("nonceB-withdraw");
        bytes32 commitA = _commit(1, nonceA, alice, sessionAddr);
        bytes32 commitB = _commit(2, nonceB, bob, sessionAddr);

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.prank(alice);
        session.revealChoice(1, nonceA);
        vm.prank(bob);
        session.revealChoice(2, nonceB);

        factory.finalizeSession(sessionAddr);

        uint256 fee = factory.totalFees();
        uint256 aliceStart = alice.balance;
        factory.withdrawFees(alice, fee);
        assertEq(factory.totalFees(), 0);
        assertEq(alice.balance, aliceStart + fee);
    }

    function testRemoveSessionAfterFinalize() external {
        address sessionAddr = factory.createSession(MIN_BET, MAX_PLAYERS, DURATION, GameSession.GameType.CoinFlip);
        GameSession session = GameSession(sessionAddr);

        bytes32 nonceA = keccak256("nonceA-remove");
        bytes32 nonceB = keccak256("nonceB-remove");
        bytes32 commitA = _commit(1, nonceA, alice, sessionAddr);
        bytes32 commitB = _commit(2, nonceB, bob, sessionAddr);

        vm.prank(alice);
        session.joinSession{value: MIN_BET}(commitA);
        vm.prank(bob);
        session.joinSession{value: MIN_BET}(commitB);

        vm.prank(alice);
        session.revealChoice(1, nonceA);
        vm.prank(bob);
        session.revealChoice(2, nonceB);

        factory.finalizeSession(sessionAddr);

        factory.removeSession(sessionAddr);

        address[] memory all = factory.getAllSessions();
        assertEq(all.length, 0);

        (address creator, uint256 minBet, uint8 maxPlayers, uint256 duration, GameSession.GameType gameType, SessionFactory.SessionState state, uint64 createdAt) =
            factory.sessionInfo(sessionAddr);
        assertEq(creator, address(0));
        assertEq(minBet, 0);
        assertEq(maxPlayers, 0);
        assertEq(duration, 0);
        assertEq(uint8(gameType), 0);
        assertEq(uint8(state), 0);
        assertEq(createdAt, 0);
    }

    function _commit(uint8 choice, bytes32 nonce, address player, address session) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(choice, nonce, player, session));
    }
}
