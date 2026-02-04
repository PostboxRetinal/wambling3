// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {GameToken} from "../src/GameToken.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployGameToken is Script {
    function run() public returns (GameToken) {
        HelperConfig helperConfig = new HelperConfig();
        address OWNER = helperConfig.i_owner();

        vm.startBroadcast();
        GameToken gameToken = new GameToken(OWNER, RECIPIENT);
        vm.stopBroadcast();

        return gameToken;
    }
}