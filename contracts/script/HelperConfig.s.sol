// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    address public i_owner;

    constructor() {
        if (block.chainid == 31337) {
            i_owner = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        } else {
            i_owner = 0x4413AE016a90D98148ADe4E9414B7712Fb09e997;
        }
    }
}