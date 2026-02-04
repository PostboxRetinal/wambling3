// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {GameToken} from "src/GameToken.sol";
import {DevOpsTools} from "lib/foundry-devops/src/DevOpsTools.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract MintGameToken is Script {
    address public OWNER;

    constructor() {
        HelperConfig helperConfig = new HelperConfig();
        OWNER = helperConfig.i_owner();
    }

    function run() public {
        address mostRecentlyDeployed = DevOpsTools.get_most_recent_deployment(
            "GameToken",
            block.chainid
        );
        mintGameTokenOnContract(mostRecentlyDeployed);
    }

    function mintGameTokenOnContract(address gameToken) public {
        vm.startBroadcast();
        GameToken(gameToken).mint(OWNER, 1000 ether);
        vm.stopBroadcast();
    }
}