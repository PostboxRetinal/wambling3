// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";

import {SessionFactory} from "../src/SessionFactory.sol";
import {RockPaperScissors} from "../src/RockPaperScissors.sol";

/// @notice Foundry script to deploy RPS implementation + SessionFactory and set the implementation.
contract DeployRpsFactoryAndImplementation is Script {
    function run() external returns (SessionFactory factory, RockPaperScissors implementation) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address referee = vm.envOr("RPS_REFEREE_ADDRESS", deployer);
        if (referee == address(0)) {
            referee = deployer;
        }

        vm.startBroadcast(deployerKey);
        implementation = new RockPaperScissors(referee);
        factory = new SessionFactory();
        factory.setRpsImplementation(address(implementation));
        vm.stopBroadcast();

        console2.log("Deployer:", deployer);
        console2.log("Referee:", referee);
        console2.log("RockPaperScissors implementation:", address(implementation));
        console2.log("SessionFactory:", address(factory));
    }
}