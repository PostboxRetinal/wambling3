// [AGENT-GENERATED]
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {RockPaperScissors} from "../src/RockPaperScissors.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract RockPaperScissorsTest is Test {
    RockPaperScissors private rps;

    address private alice = address(0xA11CE);
    address private bob = address(0xB0B);

    uint256 private refereeKey = 0xBEEF;
    address private referee;

    uint256 private constant BET = 1 ether;

    receive() external payable {}

    function setUp() external {
        referee = vm.addr(refereeKey);
        rps = new RockPaperScissors(referee);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.txGasPrice(0);
    }

    function testFullFlowClaimPrize() external {
        uint256 aliceStart = alice.balance;

        vm.prank(alice);
        uint256 gameId = rps.createGame{value: BET}(3);

        vm.prank(bob);
        rps.joinGame{value: BET}(gameId);

        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _commit(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));
        _reveal(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _reveal(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));

        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt3"));
        _commit(gameId, bob, RockPaperScissors.Move.Paper, bytes32("salt4"));
        _reveal(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt3"));
        _reveal(gameId, bob, RockPaperScissors.Move.Paper, bytes32("salt4"));

        _commit(gameId, alice, RockPaperScissors.Move.Scissors, bytes32("salt5"));
        _commit(gameId, bob, RockPaperScissors.Move.Paper, bytes32("salt6"));
        _reveal(gameId, alice, RockPaperScissors.Move.Scissors, bytes32("salt5"));
        _reveal(gameId, bob, RockPaperScissors.Move.Paper, bytes32("salt6"));

        (,,,,,,,, RockPaperScissors.GameState state,) = rps.games(gameId);
        assertEq(uint8(state), uint8(RockPaperScissors.GameState.AwaitingReferee));

        bytes memory signature = _signReferee(gameId, alice, 2 ether, 0);

        vm.prank(alice);
        rps.claimPrize(gameId, signature);

        (,,,,,,,, state,) = rps.games(gameId);
        assertEq(uint8(state), uint8(RockPaperScissors.GameState.Paid));
        assertEq(rps.nonces(gameId), 1);
        assertEq(alice.balance, aliceStart - BET + 2 ether);
    }

    function testClaimPrizeRejectsWrongSigner() external {
        vm.prank(alice);
        uint256 gameId = rps.createGame{value: BET}(1);

        vm.prank(bob);
        rps.joinGame{value: BET}(gameId);

        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _commit(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));
        _reveal(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _reveal(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));

        uint256 badKey = 0x1234;
        bytes memory signature = _signWithKey(badKey, gameId, alice, 2 ether, 0);

        vm.prank(alice);
        vm.expectRevert(RockPaperScissors.InvalidSignature.selector);
        rps.claimPrize(gameId, signature);
    }

    function testClaimPrizeRejectsNonPlayer() external {
        vm.prank(alice);
        uint256 gameId = rps.createGame{value: BET}(1);

        vm.prank(bob);
        rps.joinGame{value: BET}(gameId);

        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _commit(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));
        _reveal(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _reveal(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));

        bytes memory signature = _signReferee(gameId, alice, 2 ether, 0);

        vm.expectRevert(RockPaperScissors.NotPlayer.selector);
        rps.claimPrize(gameId, signature);
    }

    function testClaimPrizePreventsReplay() external {
        vm.prank(alice);
        uint256 gameId = rps.createGame{value: BET}(1);

        vm.prank(bob);
        rps.joinGame{value: BET}(gameId);

        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _commit(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));
        _reveal(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _reveal(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));

        bytes memory signature = _signReferee(gameId, alice, 2 ether, 0);

        vm.prank(alice);
        rps.claimPrize(gameId, signature);

        vm.prank(alice);
        vm.expectRevert(RockPaperScissors.GameNotReady.selector);
        rps.claimPrize(gameId, signature);
    }

    function testInitializeOnlyOnce() external {
        vm.expectRevert(RockPaperScissors.InvalidState.selector);
        rps.initialize(referee, address(this));
    }

    function testSetRefereeOnlyOwner() external {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice)
        );
        rps.setRefereeAddress(bob);
    }

    function testCreateGameRejectsInvalidParams() external {
        vm.expectRevert(RockPaperScissors.InvalidParams.selector);
        rps.createGame{value: BET}(2);

        vm.expectRevert(RockPaperScissors.InvalidParams.selector);
        rps.createGame(3);
    }

    function testJoinGameStakeMismatch() external {
        vm.prank(alice);
        uint256 gameId = rps.createGame{value: BET}(1);

        vm.prank(bob);
        vm.expectRevert(RockPaperScissors.StakeMismatch.selector);
        rps.joinGame{value: BET / 2}(gameId);
    }

    function testCommitRejectsNonPlayer() external {
        uint256 gameId = _startGameBestOf1();
        bytes32 commitment = keccak256(abi.encodePacked(uint8(RockPaperScissors.Move.Rock), bytes32("salt")));

        vm.prank(address(0xCAFE));
        vm.expectRevert(RockPaperScissors.NotPlayer.selector);
        rps.commitMove(gameId, commitment);
    }

    function testRevealRejectsWrongSalt() external {
        uint256 gameId = _startGameBestOf1();
        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _commit(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));

        vm.prank(alice);
        vm.expectRevert(RockPaperScissors.InvalidReveal.selector);
        rps.revealMove(gameId, RockPaperScissors.Move.Rock, bytes32("bad"));
    }

    function testClaimPrizeBeforeAwaitingReferee() external {
        uint256 gameId = _startGameBestOf1();

        vm.prank(alice);
        vm.expectRevert(RockPaperScissors.GameNotReady.selector);
        rps.claimPrize(gameId, "");
    }

    function testClaimPrizeRejectsWrongNonce() external {
        uint256 gameId = _startGameBestOf1();
        _completeSingleRoundForAlice(gameId);

        bytes memory signature = _signReferee(gameId, alice, 2 ether, 1);

        vm.prank(alice);
        vm.expectRevert(RockPaperScissors.InvalidSignature.selector);
        rps.claimPrize(gameId, signature);
    }

    function _startGameBestOf1() internal returns (uint256 gameId) {
        vm.prank(alice);
        gameId = rps.createGame{value: BET}(1);

        vm.prank(bob);
        rps.joinGame{value: BET}(gameId);
    }

    function _completeSingleRoundForAlice(uint256 gameId) internal {
        _commit(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _commit(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));
        _reveal(gameId, alice, RockPaperScissors.Move.Rock, bytes32("salt1"));
        _reveal(gameId, bob, RockPaperScissors.Move.Scissors, bytes32("salt2"));
    }

    function _commit(uint256 gameId, address player, RockPaperScissors.Move move, bytes32 salt) internal {
        bytes32 commitment = keccak256(abi.encodePacked(uint8(move), salt));
        vm.prank(player);
        rps.commitMove(gameId, commitment);
    }

    function _reveal(uint256 gameId, address player, RockPaperScissors.Move move, bytes32 salt) internal {
        vm.prank(player);
        rps.revealMove(gameId, move, salt);
    }

    function _signReferee(
        uint256 gameId,
        address winner,
        uint256 amount,
        uint256 nonce
    ) internal view returns (bytes memory signature) {
        return _signWithKey(refereeKey, gameId, winner, amount, nonce);
    }

    function _signWithKey(
        uint256 signingKey,
        uint256 gameId,
        address winner,
        uint256 amount,
        uint256 nonce
    ) internal view returns (bytes memory signature) {
        bytes32 structHash = keccak256(
            abi.encode(rps.REFEREE_TYPEHASH(), gameId, winner, amount, nonce)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signingKey, digest);
        signature = abi.encodePacked(r, s, v);
    }

    function _domainSeparator() internal view returns (bytes32) {
        bytes32 typeHash = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        bytes32 nameHash = keccak256(bytes("Wambling3 RockPaperScissors"));
        bytes32 versionHash = keccak256(bytes("1"));
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(rps)));
    }
}