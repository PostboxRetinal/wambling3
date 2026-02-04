import { initiateSmartContractPlatformClient } from "@circle-fin/smart-contract-platform";

const client = initiateSmartContractPlatformClient({
  apiKey: "<YOUR_API_KEY>",
  entitySecret: "<YOUR_ENTITY_SECRET>",
});

const abiJson = PASTE_YOUR_ABI_JSON_HERE;

const bytecode = "0xPASTE_YOUR_BYTECODE_HERE";

const response = await client.deployContract({
  name: "MerchantTreasury Contract",
  description:
    "Contract to receive payments and allow an owner to withdraw funds",
  blockchain: "ARC-TESTNET",
  walletId: "<WALLET_ID>",
  abiJson: JSON.stringify(abiJson, null, 2),
  bytecode: bytecode,
  constructorParameters: [
    "<WALLET_ADDRESS>", // Initial owner of the contract
    "0x3600000000000000000000000000000000000000", // USDC contract address on Arc Testnet
  ],
  fee: {
    type: "level",
    config: {
      feeLevel: "MEDIUM",
    },
  },
});
console.log(response.data);