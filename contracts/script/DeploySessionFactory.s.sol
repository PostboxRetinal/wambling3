// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";

import {SessionFactory} from "../src/SessionFactory.sol";

/// @notice Foundry script to deploy SessionFactory.
contract DeploySessionFactory is Script {
    function run() external returns (SessionFactory factory) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        factory = new SessionFactory();
        vm.stopBroadcast();

        console2.log("SessionFactory deployed at:", address(factory));
    }
}
