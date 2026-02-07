// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {SessionFactory} from "../src/SessionFactory.sol";
import {GameSessionPressencial} from "../src/GameSessionPressencial.sol";

contract GameSessionPressencialTest is Test {
    SessionFactory private factory;

    address private opponent = address(0xB0B);
    address private arbiter = address(0xBEEF);
    address private teamWallet = address(0xFEE1);

    uint256 private constant STAKE = 1 ether;

    function setUp() external {
        factory = new SessionFactory();
        vm.deal(opponent, 10 ether);
        vm.deal(arbiter, 10 ether);
        vm.deal(teamWallet, 10 ether);
        vm.txGasPrice(0);
    }

    function testInitializeOnlyOnce() external {
        address sessionAddr = _createSession();
        GameSessionPressencial session = GameSessionPressencial(sessionAddr);

        vm.expectRevert(GameSessionPressencial.AlreadyInitialized.selector);
        session.initialize{value: STAKE}(address(factory), address(this), arbiter, STAKE, GameSessionPressencial.GameType.Chess);
    }

    function testJoinRejectsCreator() external {
        address sessionAddr = _createSession();
        GameSessionPressencial session = GameSessionPressencial(sessionAddr);

        vm.expectRevert(GameSessionPressencial.SameAsCreator.selector);
        session.joinSession{value: STAKE}();
    }

    function testJoinRequiresExactStake() external {
        address sessionAddr = _createSession();
        GameSessionPressencial session = GameSessionPressencial(sessionAddr);

        vm.prank(opponent);
        vm.expectRevert(GameSessionPressencial.StakeMismatch.selector);
        session.joinSession{value: STAKE - 1}();
    }

    function testFinalizeOnlyFactory() external {
        address sessionAddr = _createSession();
        GameSessionPressencial session = GameSessionPressencial(sessionAddr);

        vm.prank(opponent);
        session.joinSession{value: STAKE}();

        vm.prank(arbiter);
        vm.expectRevert(GameSessionPressencial.NotFactory.selector);
        session.finalizeFromFactory(arbiter);
    }

    function testFinalizeRejectsInvalidWinner() external {
        address sessionAddr = _createSession();
        GameSessionPressencial session = GameSessionPressencial(sessionAddr);

        vm.prank(opponent);
        session.joinSession{value: STAKE}();

        vm.prank(address(factory));
        vm.expectRevert(GameSessionPressencial.InvalidWinner.selector);
        session.finalizeFromFactory(address(0xDEAD));
    }

    function testFinalizePaysWinnerAndRecordsDuration() external {
        factory.setTeamWallet(teamWallet);

        address sessionAddr = _createSession();
        GameSessionPressencial session = GameSessionPressencial(sessionAddr);

        uint256 opponentStart = opponent.balance;
        uint256 teamStart = teamWallet.balance;

        vm.prank(opponent);
        session.joinSession{value: STAKE}();

        vm.warp(block.timestamp + 12);

        vm.prank(arbiter);
        factory.finalizeSession(sessionAddr, opponent);

        uint256 fee = (2 ether * session.FEE_BPS()) / session.BPS_DENOMINATOR();
        uint256 payout = 2 ether - fee;

        assertEq(uint8(session.sessionState()), uint8(GameSessionPressencial.SessionState.Finalized));
        assertEq(session.winner(), opponent);
        assertEq(session.durationSeconds(), 12);
        assertEq(opponent.balance, opponentStart - STAKE + payout);
        assertEq(teamWallet.balance, teamStart + fee);
        assertEq(factory.totalFees(), 0);
    }

    function _createSession() private returns (address) {
        return factory.createPressencialSession{value: STAKE}(STAKE, arbiter, GameSessionPressencial.GameType.Chess);
    }
}
