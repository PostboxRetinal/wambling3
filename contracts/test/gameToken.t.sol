// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {GameToken} from "../src/gameToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GameTokenTest is Test {
    GameToken public gameToken;
    address public constant OWNER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 10_000 * 10 ** DECIMALS;
    address public RECIPIENT = makeAddr("recipient");

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function setUp() public {
        // Deploy the GameToken contract before each test
        gameToken = new GameToken(RECIPIENT, OWNER);
    }

    function testOwner() public view {
        // Check that the owner is set correctly
        assertEq(gameToken.owner(), OWNER);
    }

    function testInitialSupply() public view {
        // Check that the initial supply is minted to the recipient 
        assertEq(gameToken.totalSupply(), INITIAL_SUPPLY);
        assertEq(gameToken.balanceOf(RECIPIENT), INITIAL_SUPPLY);
    }

    function testTokenDetails() public view {
        // Check token name and symbol
        assertEq(gameToken.name(), "gameToken");
        assertEq(gameToken.symbol(), "ETH");
    }

    function testMint() public {
        // Check that only the owner can mint new tokens
        vm.prank(OWNER);
        gameToken.mint(RECIPIENT, 1000 * 10 ** DECIMALS);
    }

    function testTotalSupplyAfterMint() public {
        // Check total supply after minting new tokens
        vm.prank(OWNER);
        gameToken.mint(RECIPIENT, 1000 * 10 ** DECIMALS);
        assertEq(gameToken.totalSupply(), INITIAL_SUPPLY + 1000 * 10 ** DECIMALS);
    }

    function testOnlyOwnerCanMint() public {
        // Check that non-owners cannot mint new tokens
        vm.prank(RECIPIENT);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector, RECIPIENT
            )
        );
        gameToken.mint(RECIPIENT, 1000 * 10 ** DECIMALS);
    }

    function testTransfer() public {
        // Test transferring tokens
        vm.prank(OWNER);
        require(gameToken.transfer(RECIPIENT, 500 * 10 ** DECIMALS), "Transfer failed");
        assertEq(gameToken.balanceOf(RECIPIENT),500 * 10 ** DECIMALS);
    }

    function testBurn() public {
        // Test burning tokens
        vm.prank(RECIPIENT);
        gameToken.burn(200 * 10 ** DECIMALS);
        assertEq(gameToken.balanceOf(RECIPIENT), INITIAL_SUPPLY - 200 * 10 ** DECIMALS);
    }

    function testTransferEmitsTraferEvent() public {
        // Test that transfer emits Transfer event
        vm.prank(OWNER);
        vm.expectEmit(true, true, false, true, address(gameToken));
        emit Transfer(OWNER, RECIPIENT, 500 * 10 ** DECIMALS);
        require(gameToken.transfer(RECIPIENT, 500 * 10 ** DECIMALS), "Transfer failed");
        vm.stopPrank();
    }

    function testApprove() public {
        // Test approving tokens
        vm.prank(OWNER);
        require(gameToken.approve(RECIPIENT, 300 * 10 ** DECIMALS), "Approve failed");
        assertEq(gameToken.allowance(OWNER, RECIPIENT), 300 * 10 ** DECIMALS);
    }
    
    function testApproveEmitsApprovalEvent() public {
        // Test that approve emits Approval event
        vm.startPrank(OWNER);
        vm.expectEmit(true, true, false, true, address(gameToken));
        emit Approval(OWNER, RECIPIENT, 300 * 10 ** DECIMALS);
        require(gameToken.approve(RECIPIENT, 300 * 10 ** DECIMALS), "Approve failed");
        vm.stopPrank();
    }

    function testTransferFromWithApproval() public {
        // Test transferFrom with approval
        // RECIPIENT has all tokens, approves OWNER to spend 400 tokens
        vm.prank(RECIPIENT);
        require(gameToken.approve(OWNER, 400 * 10 ** DECIMALS), "Approve failed");

        // OWNER uses transferFrom to move tokens from RECIPIENT to themselves
        vm.prank(OWNER);
        require(gameToken.transferFrom(RECIPIENT, OWNER, 400 * 10 ** DECIMALS), "TransferFrom failed");
        
        assertEq(gameToken.balanceOf(OWNER), 400 * 10 ** DECIMALS);
        assertEq(gameToken.balanceOf(RECIPIENT), INITIAL_SUPPLY - 400 * 10 ** DECIMALS);
    }

    function testCannotTransferFromWithoutApproval() public {
        // Test that transferFrom without approval fails
        vm.startPrank(OWNER);
        vm.expectRevert("ERC20: insufficient allowance");
        gameToken.transferFrom(RECIPIENT, OWNER, 100 * 10 ** DECIMALS);
    }


}