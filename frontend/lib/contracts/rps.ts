// [AGENT-GENERATED]
// [Agent-Generated] Minimal RockPaperScissors ABI for on-chain game creation.
import type { Abi } from "viem";

export const RPS_ABI = [
  {
    type: "function",
    name: "createGame",
    inputs: [
      {
        name: "bestOf",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "referee",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "joinGame",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "commitMove",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "commitment",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revealMove",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "move",
        type: "uint8",
        internalType: "enum RockPaperScissors.Move",
      },
      {
        name: "salt",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimPrize",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "signature",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimPrizeTimeout",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "GameCreated",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
      {
        indexed: true,
        name: "player1",
        type: "address",
        internalType: "address",
      },
      {
        indexed: false,
        name: "bet",
        type: "uint256",
        internalType: "uint256",
      },
      {
        indexed: false,
        name: "bestOf",
        type: "uint8",
        internalType: "uint8",
      },
    ],
  },
  {
    type: "function",
    name: "games",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "player1",
        type: "address",
        internalType: "address",
      },
      {
        name: "player2",
        type: "address",
        internalType: "address",
      },
      {
        name: "referee",
        type: "address",
        internalType: "address",
      },
      {
        name: "winner",
        type: "address",
        internalType: "address",
      },
      {
        name: "bet",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "pot",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "bestOf",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "winsP1",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "winsP2",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "round",
        type: "uint8",
        internalType: "uint8",
      },
      {
        name: "state",
        type: "uint8",
        internalType: "enum RockPaperScissors.GameState",
      },
      {
        name: "paid",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "resolvedAt",
        type: "uint64",
        internalType: "uint64",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [
      {
        name: "gameId",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
] as const satisfies Abi;
