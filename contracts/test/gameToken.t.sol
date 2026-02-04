// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {GameToken} from "../src/gameToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {IERC20Errors} from "lib/openzeppelin-contracts/contracts/interfaces/draft-IERC6093.sol";


contract GameTokenTest is Test {
    GameToken public gameToken;
    address public constant OWNER = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    uint256 public constant DECIMALS = 18;
    uint256 public constant INITIAL_SUPPLY = 10_000 * 10 ** DECIMALS;
    address public RECIPIENT = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address public RECIPIENT2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;

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

        // OWNER uses transferFrom to move tokens from RECIPIENT to RECIPIENT2
        vm.prank(OWNER);
        require(gameToken.transferFrom(RECIPIENT, RECIPIENT2, 400 * 10 ** DECIMALS), "TransferFrom failed");
        
        assertEq(gameToken.balanceOf(RECIPIENT2), 400 * 10 ** DECIMALS);
        assertEq(gameToken.balanceOf(RECIPIENT), INITIAL_SUPPLY - 400 * 10 ** DECIMALS);
        assertEq(gameToken.allowance(RECIPIENT, OWNER), 0);
    }

    function testCannotTransferFromWithoutApproval() public {
        // Test that transferFrom without approval fails
        vm.prank(OWNER);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector, OWNER, 0, 100 * 10 ** DECIMALS
            )
        );
        gameToken.transferFrom(RECIPIENT, OWNER, 100 * 10 ** DECIMALS);
    }

    function testBurn() public {
        // Test burning tokens
        uint256 initialBalance = gameToken.balanceOf(OWNER);

        vm.prank(OWNER);
        gameToken.burn(200 * 10 ** DECIMALS);
        
        assertEq(gameToken.totalSupply(), INITIAL_SUPPLY - 200 * 10 ** DECIMALS);    
        assertEq(gameToken.balanceOf(OWNER), initialBalance - 200 * 10 ** DECIMALS);
    }

    function testBurnEmitsTransferEvent() public {
        vm.startPrank(OWNER);
        vm.expectEmit(true, true, false, true, address(diamondToken));
        emit IERC20.Transfer(OWNER, address(0), 100 * 10 ** DECIMALS);
        diamondToken.burn(100 * 10 ** DECIMALS);
        vm.stopPrank();
    }

    function testCannotBurnWithoutApproval() public {
        vm.prank(RECIPIENT);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector,
                RECIPIENT,
                0,
                100 * 10 ** DECIMALS
            )
        );
        diamondToken.burnFrom(OWNER, 100 * 10 ** DECIMALS);
        vm.stopPrank();
    }
}