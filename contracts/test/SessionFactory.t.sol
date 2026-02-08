// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {SessionFactory} from "../src/SessionFactory.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SessionFactoryTest is Test {
    SessionFactory private factory;

    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    uint256 private constant STAKE = 1 ether;

    receive() external payable {}

    function setUp() external {
        factory = new SessionFactory();
        vm.deal(address(this), 10 ether);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.txGasPrice(0);
    }

    function testCreateJoinFinalize() external {
        uint256 sessionId = factory.createSession{value: STAKE}(
            STAKE,
            SessionFactory.GameType.CoinFlip
        );

        address creator;
        address opponent;
        address winner;
        uint256 stake;
        SessionFactory.GameType gameType;
        SessionFactory.SessionState state;
        uint64 createdAt;

        (creator, opponent, winner, stake, gameType, state, createdAt) =
            factory.sessionInfo(sessionId);

        assertEq(creator, address(this));
        assertEq(opponent, address(0));
        assertEq(winner, address(0));
        assertEq(stake, STAKE);
        assertEq(uint8(gameType), uint8(SessionFactory.GameType.CoinFlip));
        assertEq(uint8(state), uint8(SessionFactory.SessionState.Active));
        assertEq(createdAt > 0, true);

        uint256 aliceStart = alice.balance;

        vm.prank(alice);
        factory.joinSession{value: STAKE}(sessionId);

        factory.finalizeSession(sessionId, alice);

        uint256 fee = (2 ether * factory.FEE_BPS()) / factory.BPS_DENOMINATOR();
        uint256 payout = 2 ether - fee;

        assertEq(alice.balance, aliceStart - STAKE + payout);
        assertEq(factory.totalFees(), fee);
    }

    function testFinalizeRequiresOwner() external {
        uint256 sessionId = factory.createSession{value: STAKE}(
            STAKE,
            SessionFactory.GameType.RockPaperScissors
        );

        vm.prank(alice);
        factory.joinSession{value: STAKE}(sessionId);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, bob)
        );
        factory.finalizeSession(sessionId, alice);
    }

    function testCancelBeforeJoinRefundsCreator() external {
        uint256 creatorStart = address(this).balance;

        uint256 sessionId = factory.createSession{value: STAKE}(
            STAKE,
            SessionFactory.GameType.CoinFlip
        );

        factory.cancelSession(sessionId);

        (, , , , , SessionFactory.SessionState state, ) = factory.sessionInfo(sessionId);
        assertEq(uint8(state), uint8(SessionFactory.SessionState.Cancelled));
        assertEq(address(this).balance, creatorStart);
    }

    function testWithdrawFees() external {
        uint256 sessionId = factory.createSession{value: STAKE}(
            STAKE,
            SessionFactory.GameType.CoinFlip
        );

        vm.prank(alice);
        factory.joinSession{value: STAKE}(sessionId);

        factory.finalizeSession(sessionId, alice);

        uint256 fee = factory.totalFees();
        uint256 aliceStart = alice.balance;
        factory.withdrawFees(alice, fee);
        assertEq(factory.totalFees(), 0);
        assertEq(alice.balance, aliceStart + fee);
    }
}
