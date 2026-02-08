// [AGENT-GENERATED]
"use client";

// [Agent-Generated] SessionFactory-powered bowl experience.
import { useEffect, useMemo, useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { useBowl } from "@/hooks/web3/useBowl";
import { useGameSession } from "@/hooks/web3/useGameSession";
import { useEnsName } from "@/hooks/web3/useEnsName";
import { SESSION_FACTORY_ABI } from "@/lib/contracts/sessionFactory";
import {
  assertSessionFactoryAddress,
  SESSION_FACTORY_CHAIN,
  SESSION_FACTORY_RPC_URL,
} from "@/lib/contracts/sessionFactory";
import type { GameId } from "@/types/game.types";
import { useWalletBalance } from "@/hooks/web3/useWallet";
import { createPublicClient, formatEther, http, isAddress } from "viem";
import { useSearchParams } from "next/navigation";
import { useRpsGame } from "@/hooks/web3/useRpsGame";
import { useRpsReferee } from "@/hooks/web3/useRpsReferee";

export const Bowl = () => {
  const searchParams = useSearchParams();
  const selectedGame = "rps" as GameId;
  const sessionParam = searchParams.get("session") ?? "";
  const selectedMode = "offchain";
  const {
    betAmount,
    setBetAmount,
    isAnimating,
    coins,
    quickAmounts,
    handleQuickAmount,
    handleBet,
    isBetValid,
    txState,
    createRpsClone,
    setRpsImplementation,
    resetTxState,
  } = useBowl({ selectedGame, selectedMode });

  // [Agent-Generated] Local session input + player UX state.
  const [flowMode, setFlowMode] = useState<"create" | "join">("create");
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [copiedSession, setCopiedSession] = useState(false);
  const [escrowTouched, setEscrowTouched] = useState(false);
  const [escrowAddress, setEscrowAddress] = useState("");
  const [lastEscrowAddress, setLastEscrowAddress] = useState("");
  const [activeEscrow, setActiveEscrow] = useState("");
  const [activeGameId, setActiveGameId] = useState("");
  const [joinEscrowTouched, setJoinEscrowTouched] = useState(false);
  const [joinEscrowAddress, setJoinEscrowAddress] = useState("");
  const [joinGameId, setJoinGameId] = useState("");
  const [joinBetAmount, setJoinBetAmount] = useState("");
  const [playEscrowAddress, setPlayEscrowAddress] = useState("");
  const [playGameId, setPlayGameId] = useState("");
  const [playMove, setPlayMove] = useState<"rock" | "paper" | "scissors" | "">("");
  const [playSalt, setPlaySalt] = useState("");
  const [copiedSalt, setCopiedSalt] = useState(false);
  const [autoSalt, setAutoSalt] = useState("");
  const [refEscrowAddress, setRefEscrowAddress] = useState("");
  const [refGameId, setRefGameId] = useState("");
  const [refWinner, setRefWinner] = useState("");
  const [copiedSignature, setCopiedSignature] = useState(false);
  const [refereeTouched, setRefereeTouched] = useState(false);
  const [refereeAddress, setRefereeAddress] = useState("");
  const [bestOf, setBestOf] = useState(3);
  const [implementationTouched, setImplementationTouched] = useState(false);
  const [implementationAddress, setImplementationAddress] = useState(
    process.env.NEXT_PUBLIC_RPS_IMPLEMENTATION_ADDRESS ?? "",
  );
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);
  const [showAdminTools, setShowAdminTools] = useState(false);

  const {
    snapshot,
    isLoading: isSessionLoading,
    error: sessionError,
    refresh,
    joinOnsite,
    actionState,
    resetActionState,
  } = useGameSession({
    sessionId: sessionIdInput,
  });

  const {
    txState: rpsTxState,
    resetTxState: resetRpsTxState,
    createGame,
    joinGame,
    commitMove,
    revealMove,
  } = useRpsGame();

  const {
    state: refereeState,
    signDecision,
    loadGameInfo,
  } = useRpsReferee();

  const { balance, isLoading: isBalanceLoading } = useWalletBalance();
  const { wallets } = useWallets();
  const currentAddress = wallets[0]?.address ?? null;
  const { ensName: currentEnsName } = useEnsName(currentAddress);
  const opponentAddress = snapshot?.opponent ?? null;
  const { ensName: opponentEnsName } = useEnsName(opponentAddress);
  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasBalance = !!balance && !Number.isNaN(balanceNum);
  const betAmountNum = betAmount ? parseFloat(betAmount) : 0;
  const isOverBalance = !!betAmount && hasBalance && betAmountNum > balanceNum;
  const isSubmitting =
    txState.status === "signing" || txState.status === "pending";
  const isEscrowSubmitting =
    txState.action === "create-escrow" && isSubmitting;
  const isImplementationSubmitting =
    txState.action === "set-implementation" && isSubmitting;
  const isOwner =
    !!ownerAddress &&
    !!currentAddress &&
    ownerAddress.toLowerCase() === currentAddress.toLowerCase();

  const normalizedEscrow = escrowAddress.trim();
  const isZeroEscrow =
    normalizedEscrow.toLowerCase() ===
    "0x0000000000000000000000000000000000000000";
  const isEscrowValid =
    !!normalizedEscrow && isAddress(normalizedEscrow) && !isZeroEscrow;

  const normalizedReferee = refereeAddress.trim();
  const isZeroReferee =
    normalizedReferee.toLowerCase() ===
    "0x0000000000000000000000000000000000000000";
  const isRefereeValid =
    !!normalizedReferee && isAddress(normalizedReferee) && !isZeroReferee;
  const tablePlayers = useMemo(() => {
    const players = [currentAddress, snapshot?.creator, snapshot?.opponent]
      .filter(Boolean)
      .map((addr) => addr!.toLowerCase());
    return new Set(players);
  }, [currentAddress, snapshot?.creator, snapshot?.opponent]);
  const isRefereeThirdParty =
    isRefereeValid && !tablePlayers.has(normalizedReferee.toLowerCase());
  const refereeError = useMemo(() => {
    if (!refereeTouched) return null;
    if (!normalizedReferee) return "Referee wallet is required.";
    if (!isRefereeValid) return "Invalid referee address.";
    if (!isRefereeThirdParty)
      return "Referee cannot be one of the players.";
    return null;
  }, [isRefereeThirdParty, isRefereeValid, normalizedReferee, refereeTouched]);
  const escrowError = useMemo(() => {
    if (!escrowTouched) return null;
    if (!normalizedEscrow) return "Escrow address is required.";
    if (!isEscrowValid) return "Invalid escrow address.";
    return null;
  }, [escrowTouched, isEscrowValid, normalizedEscrow]);

  const normalizedImplementation = implementationAddress.trim();
  const isImplementationValid =
    !!normalizedImplementation &&
    isAddress(normalizedImplementation) &&
    normalizedImplementation.toLowerCase() !==
      "0x0000000000000000000000000000000000000000";
  const canSetImplementation =
    isOwner && isImplementationValid && !isImplementationSubmitting;
  const implementationError = useMemo(() => {
    if (!implementationTouched) return null;
    if (!normalizedImplementation) return "Implementation required.";
    if (!isImplementationValid) return "Invalid implementation address.";
    return null;
  }, [implementationTouched, isImplementationValid, normalizedImplementation]);

  const canBet =
    isBetValid &&
    !isAnimating &&
    !isSubmitting &&
    hasBalance &&
    !isOverBalance;

  const formatAddress = (addr?: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const stakeEth = useMemo(() => {
    if (!snapshot?.stake) return "";
    try {
      return formatEther(BigInt(snapshot.stake));
    } catch {
      return "";
    }
  }, [snapshot?.stake]);

  const joinAmount = stakeEth || betAmount;

  const isJoinSubmitting =
    actionState.status === "signing" || actionState.status === "pending";

  const canJoinOnsite =
    !!sessionIdInput &&
    !!joinAmount &&
    !isJoinSubmitting;

  const isRpsSubmitting =
    rpsTxState.status === "signing" || rpsTxState.status === "pending";
  const isRpsJoinSubmitting = isRpsSubmitting && rpsTxState.action === "join";
  const isRpsCreateSubmitting =
    isRpsSubmitting && rpsTxState.action === "create";
  const isRpsCommitSubmitting =
    isRpsSubmitting && rpsTxState.action === "commit";
  const isRpsRevealSubmitting =
    isRpsSubmitting && rpsTxState.action === "reveal";
  const isBestOfValid = bestOf >= 3 && bestOf <= 9 && bestOf % 2 === 1;
  const canCreateRpsGame =
    isEscrowValid &&
    isRefereeThirdParty &&
    isBestOfValid &&
    isBetValid &&
    !isOverBalance &&
    !isRpsSubmitting;

  const isRefereeLocked = !!activeEscrow || !!activeGameId || !!txState.cloneAddress;
  const lockedFieldClass =
    "text-sm bg-bg-tertiary border-border-primary text-text-primary opacity-60 cursor-not-allowed";
  const editableFieldClass =
    "text-sm bg-bg-tertiary border-border-primary text-text-primary";

  const normalizedJoinEscrow = joinEscrowAddress.trim();
  const isJoinEscrowValid =
    !!normalizedJoinEscrow &&
    isAddress(normalizedJoinEscrow) &&
    normalizedJoinEscrow.toLowerCase() !==
      "0x0000000000000000000000000000000000000000";
  const isJoinGameIdValid =
    joinGameId !== "" && Number.isFinite(Number(joinGameId));
  const isJoinBetValid =
    joinBetAmount !== "" && Number.isFinite(Number(joinBetAmount)) &&
    Number(joinBetAmount) > 0;
  const canJoinRpsGame =
    isJoinEscrowValid &&
    isJoinGameIdValid &&
    isJoinBetValid &&
    !isRpsJoinSubmitting;

  const normalizedPlayEscrow = playEscrowAddress.trim();
  const isPlayEscrowValid =
    !!normalizedPlayEscrow &&
    isAddress(normalizedPlayEscrow) &&
    normalizedPlayEscrow.toLowerCase() !==
      "0x0000000000000000000000000000000000000000";
  const isPlayGameIdValid =
    playGameId !== "" && Number.isFinite(Number(playGameId));
  const isPlayMoveValid = playMove === "rock" || playMove === "paper" || playMove === "scissors";
  const isPlaySaltValid = playSalt.trim().length > 0;
  const canCommitMove =
    isPlayEscrowValid &&
    isPlayGameIdValid &&
    isPlayMoveValid &&
    isPlaySaltValid &&
    !isRpsCommitSubmitting;
  const canRevealMove =
    isPlayEscrowValid &&
    isPlayGameIdValid &&
    isPlayMoveValid &&
    isPlaySaltValid &&
    !isRpsRevealSubmitting;

  const handleMaxBetWithBalance = () => {
    if (!hasBalance) return;
    setBetAmount(balance ?? "");
  };

  const handleBetWithBalance = () => {
    if (!canBet || flowMode !== "create") return;
    handleBet();
  };

  const handleCopySession = async () => {
    if (!sessionIdInput) return;
    await navigator.clipboard.writeText(sessionIdInput);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };


  const handleJoinSession = async () => {
    if (canJoinOnsite) {
      await joinOnsite({ betAmount: stakeEth || joinAmount });
    }
  };

  const handleCloseSession = () => {
    setSessionIdInput("");
    setFlowMode("create");
    resetActionState();
  };

  const handleCreateEscrow = async () => {
    if (isEscrowSubmitting) return;
    resetTxState();
    await createRpsClone();
  };

  const handleCreateRpsGame = async () => {
    if (!canCreateRpsGame) return;
    resetRpsTxState();
    await createGame({
      escrowAddress: normalizedEscrow,
      refereeAddress: normalizedReferee,
      bestOf,
      betAmount,
    });
  };

  const handleJoinRpsGame = async () => {
    if (!canJoinRpsGame) return;
    resetRpsTxState();
    await joinGame({
      escrowAddress: normalizedJoinEscrow,
      gameId: joinGameId,
      betAmount: joinBetAmount,
    });
  };

  const handleCommitMove = async () => {
    if (!canCommitMove || !isPlayMoveValid) return;
    resetRpsTxState();
    await commitMove({
      escrowAddress: normalizedPlayEscrow,
      gameId: playGameId,
      move: playMove,
      salt: playSalt,
    });
  };

  const handleRevealMove = async () => {
    if (!canRevealMove || !isPlayMoveValid) return;
    resetRpsTxState();
    await revealMove({
      escrowAddress: normalizedPlayEscrow,
      gameId: playGameId,
      move: playMove,
      salt: playSalt,
    });
  };

  const handleLoadRefereeGameInfo = async () => {
    if (!refEscrowAddress || !refGameId) return;
    await loadGameInfo({ escrowAddress: refEscrowAddress, gameId: refGameId });
  };

  const handleLoadSessionRpsStatus = async () => {
    const escrow =
      activeEscrow ||
      refEscrowAddress ||
      playEscrowAddress ||
      joinEscrowAddress ||
      escrowAddress;
    const gameId =
      activeGameId || refGameId || playGameId || joinGameId;

    if (!escrow || !gameId) return;
    await loadGameInfo({ escrowAddress: escrow, gameId });
  };

  useEffect(() => {
    // [AGENT-GENERATED] Auto-refresh on-chain RPS status while a game is active.
    const escrow =
      activeEscrow ||
      refEscrowAddress ||
      playEscrowAddress ||
      joinEscrowAddress ||
      escrowAddress;
    const gameId = activeGameId || refGameId || playGameId || joinGameId;

    if (!escrow || !gameId) return;

    const intervalId = window.setInterval(() => {
      loadGameInfo({ escrowAddress: escrow, gameId });
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [
    activeEscrow,
    activeGameId,
    escrowAddress,
    joinEscrowAddress,
    joinGameId,
    loadGameInfo,
    playEscrowAddress,
    playGameId,
    refEscrowAddress,
    refGameId,
  ]);

  const handleSignReferee = async () => {
    if (!refEscrowAddress || !refGameId || !refWinner) return;
    await signDecision({
      escrowAddress: refEscrowAddress,
      gameId: refGameId,
      winner: refWinner,
    });
  };

  const handleCopySignature = async () => {
    if (!refereeState.signature) return;
    await navigator.clipboard.writeText(refereeState.signature);
    setCopiedSignature(true);
    setTimeout(() => setCopiedSignature(false), 2000);
  };

  const handleGenerateSalt = () => {
    // [AGENT-GENERATED] Generate a random bytes32 salt and copy it into the input.
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const hex = `0x${Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
    setAutoSalt(hex);
    setPlaySalt(hex);
  };

  const handleCopySalt = async () => {
    const value = playSalt || autoSalt;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedSalt(true);
    setTimeout(() => setCopiedSalt(false), 2000);
  };

  const rpsGameStateLabel = useMemo(() => {
    switch (refereeState.gameState) {
      case 0:
        return "None";
      case 1:
        return "Waiting for opponent";
      case 2:
        return "Committing";
      case 3:
        return "Revealing";
      case 4:
        return "Awaiting referee";
      case 5:
        return "Paid";
      case 6:
        return "Cancelled";
      default:
        return "Unknown";
    }
  }, [refereeState.gameState]);

  // [AGENT-GENERATED] Format referee pot in ETH for readability.
  const refereePotEth = useMemo(() => {
    if (!refereeState.pot) return null;
    try {
      return formatEther(BigInt(refereeState.pot));
    } catch {
      return null;
    }
  }, [refereeState.pot]);

  const handleSetImplementation = async () => {
    if (!canSetImplementation) return;
    resetTxState();
    await setRpsImplementation({
      implementationAddress: normalizedImplementation,
    });
  };

  const playerSlots = useMemo(() => {
    const slots = [0, 1];
    if (!snapshot) {
      return slots.map((index) => ({ index, address: null }));
    }

    const onsiteAddresses = [
      snapshot.creator ?? null,
      snapshot.opponent ?? null,
    ];
    return slots.map((index) => ({
      index,
      address: onsiteAddresses[index],
    }));
  }, [snapshot]);

  const [localMove, setLocalMove] = useState<"rock" | "paper" | "scissors" | null>(
    null,
  );

  const displaySessionId = useMemo(() => {
    if (!sessionIdInput) return "No active session";
    if (sessionIdInput.length < 10) return sessionIdInput;
    return `${sessionIdInput.slice(0, 4)}..${sessionIdInput.slice(-3)}`;
  }, [sessionIdInput]);

  const rpsIcon = (move: "rock" | "paper" | "scissors" | null) => {
    switch (move) {
      case "rock":
        return (
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-xl border-2 border-gray-400">
            <span className="text-3xl">🪨</span>
          </div>
        );
      case "paper":
        return (
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl border-2 border-blue-300">
            <span className="text-3xl">📄</span>
          </div>
        );
      case "scissors":
        return (
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl border-2 border-red-400">
            <span className="text-3xl">✂️</span>
          </div>
        );
      default:
        return (
          <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-xl border-2 border-gray-300">
            <span className="text-3xl">❓</span>
          </div>
        );
    }
  };

  useEffect(() => {
    // [Agent-Generated] Auto-fill the session input when a new session is created.
    if (txState.sessionId) {
      setSessionIdInput(txState.sessionId);
      setFlowMode("join");
      refresh();
    }
  }, [refresh, txState.sessionId]);

  useEffect(() => {
    // [Agent-Generated] Honor invite links that include a session param.
    if (sessionParam) {
      setSessionIdInput(sessionParam);
      setFlowMode("join");
    }
  }, [sessionParam]);

  useEffect(() => {
    // [Agent-Generated] Refresh session data when the address or mode changes.
    if (sessionIdInput) {
      refresh();
    }
  }, [refresh, sessionIdInput, selectedMode]);

  useEffect(() => {
    // [Agent-Generated] Fetch SessionFactory owner for admin gating.
    const loadOwner = async () => {
      try {
        setIsOwnerLoading(true);
        const publicClient = createPublicClient({
          chain: SESSION_FACTORY_CHAIN,
          transport: http(SESSION_FACTORY_RPC_URL),
        });
        const owner = await publicClient.readContract({
          address: assertSessionFactoryAddress(),
          abi: SESSION_FACTORY_ABI,
          functionName: "owner",
        });
        setOwnerAddress(owner as `0x${string}`);
      } catch (error) {
        console.error("Failed to read owner:", error);
      } finally {
        setIsOwnerLoading(false);
      }
    };

    loadOwner();
  }, []);

  useEffect(() => {
    // [Agent-Generated] Persist the last created escrow and auto-fill the form.
    if (txState.cloneAddress) {
      setLastEscrowAddress(txState.cloneAddress);
      setActiveEscrow((prev) => {
        if (prev) return prev;
        return txState.cloneAddress ? txState.cloneAddress : "";
      });
      if (!escrowTouched || !escrowAddress) {
        setEscrowAddress(txState.cloneAddress);
      }
    }
  }, [escrowAddress, escrowTouched, txState.cloneAddress]);

  useEffect(() => {
    // [AGENT-GENERATED] Lock escrow + game ID after on-chain create/join.
    if (rpsTxState.status !== "confirmed" || !rpsTxState.action) return;

    if (rpsTxState.action === "create") {
      if (normalizedEscrow) setActiveEscrow(normalizedEscrow);
      if (rpsTxState.gameId) setActiveGameId(rpsTxState.gameId);
    }

    if (rpsTxState.action === "join") {
      if (normalizedJoinEscrow) setActiveEscrow(normalizedJoinEscrow);
      if (joinGameId) setActiveGameId(joinGameId);
    }
  }, [
    joinGameId,
    normalizedEscrow,
    normalizedJoinEscrow,
    rpsTxState.action,
    rpsTxState.gameId,
    rpsTxState.status,
  ]);

  useEffect(() => {
    // [AGENT-GENERATED] Propagate active escrow/gameId to all related fields.
    if (activeEscrow) {
      setEscrowAddress(activeEscrow);
      setJoinEscrowAddress(activeEscrow);
      setPlayEscrowAddress(activeEscrow);
      setRefEscrowAddress(activeEscrow);
    }
    if (activeGameId) {
      setJoinGameId(activeGameId);
      setPlayGameId(activeGameId);
      setRefGameId(activeGameId);
    }
  }, [activeEscrow, activeGameId]);

  return (
    <div className="space-y-4">
      <Card className="border-border-primary bg-linear-to-br from-bg-secondary to-bg-tertiary backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-text-primary relative z-10">
                Rock, Paper, Scissors
              </h3>
              <p className="text-sm text-text-secondary">
                Off-chain round · Ready to play
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {coins.map((coin) => (
            <div
              key={coin.id}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
              style={{
                animation: "coinDrop 1s ease-in-out forwards",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-300 shadow-2xl flex items-center justify-center animate-spin">
                <span className="text-xs font-bold text-yellow-900">
                  {coin.amount}
                </span>
              </div>
            </div>
          ))}

          {/* [Agent-Generated] Session ID with copy icon. */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-1">
                Session ID
              </p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-text-primary">
                  {displaySessionId}
                </p>
                <Button
                  onClick={handleCopySession}
                  disabled={!sessionIdInput}
                  variant="ghost"
                  size="icon"
                  className="rounded-lg hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Copy full ID"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-text-secondary hover:text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
                {copiedSession && (
                  <span className="text-xs text-green-500 font-semibold animate-pulse">
                    Copied!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* [Agent-Generated] Session status and controls. */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Session status
              </p>
              <p className="text-sm text-text-secondary">
                {isSessionLoading ? "Refreshing" : actionState.status}
              </p>
              {refereeState.gameState !== null && (
                <p className="text-xs text-text-tertiary mt-1">
                  RPS: {rpsGameStateLabel}
                  {refereeState.round !== null ? ` · Round ${refereeState.round}` : ""}
                  {refereeState.winsP1 !== null && refereeState.winsP2 !== null
                    ? ` · ${refereeState.winsP1}-${refereeState.winsP2}`
                    : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadSessionRpsStatus}
                className="border-border-primary"
              >
                Load game status
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isSessionLoading}
                className="border-border-primary"
              >
                {isSessionLoading ? "Refreshing..." : "Refresh"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseSession}
                className="border-border-primary"
              >
                Close session
              </Button>
              <Button
                type="button"
                variant={flowMode === "join" ? "default" : "outline"}
                size="sm"
                onClick={() => setFlowMode("join")}
                className="border-border-primary"
              >
                Join session
              </Button>
            </div>
          </div>

          {flowMode === "join" && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 p-4 rounded-xl border border-border-primary bg-bg-tertiary/40">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Session ID to join
                </label>
                <Input
                  value={sessionIdInput}
                  onChange={(e) => {
                    setSessionIdInput(e.target.value);
                    resetActionState();
                  }}
                  placeholder="Paste the ID here"
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Required bet (ETH)
                </label>
                <Input
                  value={joinAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={!!stakeEth}
                  placeholder={stakeEth || "0.0"}
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {stakeEth && (
                  <p className="text-xs text-text-tertiary">
                    Required stake: {stakeEth} ETH
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleJoinSession}
                  disabled={!canJoinOnsite}
                  className="w-full"
                >
                  {isJoinSubmitting ? "Joining..." : "Join session"}
                </Button>
                {actionState.hash && (
                  <p className="text-xs text-text-tertiary break-all mt-2">
                    Tx: {actionState.hash}
                  </p>
                )}
                {actionState.error && (
                  <p className="text-xs text-red-500 mt-2">{actionState.error}</p>
                )}
              </div>
            </div>
          )}

          {/* [Agent-Generated] RPS escrow creation (referee is selected per game). */}
          <div className="mt-4 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                  RPS escrow
                </p>
                <p className="text-xs text-text-secondary">
                  This deploys a game escrow. Referee is chosen per game when you start a match.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateEscrow}
                disabled={isEscrowSubmitting}
                className="border-border-primary"
              >
                {isEscrowSubmitting ? "Creating..." : "Create escrow"}
              </Button>
            </div>
            {txState.action === "create-escrow" && (
              <div className="rounded-lg border border-border-primary bg-bg-secondary/60 p-3 space-y-1">
                <p className="text-xs text-text-tertiary">
                  Status: {txState.status}
                </p>
                {txState.hash && (
                  <p className="text-xs text-text-tertiary break-all">
                    Tx: {txState.hash}
                  </p>
                )}
                {txState.cloneAddress && (
                  <p className="text-xs text-text-tertiary break-all">
                    Escrow: {txState.cloneAddress}
                  </p>
                )}
                {txState.error && (
                  <p className="text-xs text-red-500">{txState.error}</p>
                )}
              </div>
            )}
          </div>

          {/* [AGENT-GENERATED] On-chain RPS match setup with third-party referee. */}
          <div className="mt-4 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                On-chain match
              </p>
              <p className="text-xs text-text-secondary">
                Choose a third-party referee who will sign the final payout.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Escrow contract
                </label>
                <Input
                  value={activeEscrow || escrowAddress}
                  onChange={(e) => {
                    if (activeEscrow) return;
                    setEscrowAddress(e.target.value);
                    setEscrowTouched(true);
                  }}
                  onBlur={() => setEscrowTouched(true)}
                  readOnly={!!activeEscrow}
                  placeholder={lastEscrowAddress || "0xEscrowAddress"}
                  className={activeEscrow ? lockedFieldClass : editableFieldClass}
                />
                {lastEscrowAddress && (
                  <p className="text-xs text-text-tertiary break-all">
                    Last escrow: {lastEscrowAddress}
                  </p>
                )}
                {escrowError && (
                  <p className="text-xs text-red-500">{escrowError}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Referee wallet
                </label>
                <Input
                  value={refereeAddress}
                  onChange={(e) => {
                    if (isRefereeLocked) return;
                    setRefereeAddress(e.target.value);
                    setRefereeTouched(true);
                  }}
                  onBlur={() => setRefereeTouched(true)}
                  readOnly={isRefereeLocked}
                  placeholder="0xRefereeWallet"
                  className={isRefereeLocked ? lockedFieldClass : editableFieldClass}
                />
                {refereeError && (
                  <p className="text-xs text-red-500">{refereeError}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Best of
                </label>
                <select
                  value={bestOf}
                  onChange={(e) => setBestOf(Number(e.target.value))}
                  className="h-10 rounded-md border border-border-primary bg-bg-tertiary text-text-primary text-sm px-3"
                >
                  <option value={3}>Best of 3</option>
                  <option value={5}>Best of 5</option>
                  <option value={7}>Best of 7</option>
                  <option value={9}>Best of 9</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Bet (ETH)
                </label>
                <Input
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.0"
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {!isBestOfValid && (
                  <p className="text-xs text-red-500">
                    Best-of must be an odd number between 3 and 9.
                  </p>
                )}
              </div>
            </div>
            <Button
              type="button"
              onClick={handleCreateRpsGame}
              disabled={!canCreateRpsGame}
              className="w-full"
            >
              {isRpsCreateSubmitting
                ? "Creating on-chain match..."
                : "Start on-chain match"}
            </Button>
            {rpsTxState.action === "create" && rpsTxState.hash && (
              <p className="text-xs text-text-tertiary break-all">
                Tx: {rpsTxState.hash}
              </p>
            )}
            {rpsTxState.action === "create" && rpsTxState.gameId && (
              <p className="text-xs text-text-tertiary">
                Game ID: {rpsTxState.gameId}
              </p>
            )}
            {rpsTxState.action === "create" && rpsTxState.error && (
              <p className="text-xs text-red-500">{rpsTxState.error}</p>
            )}
          </div>

          {/* [AGENT-GENERATED] Join an on-chain RPS match. */}
          <div className="mt-4 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Join on-chain match
              </p>
              <p className="text-xs text-text-secondary">
                Paste the escrow address + game ID shared by the creator.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Escrow contract
                </label>
                <Input
                  value={activeEscrow || joinEscrowAddress}
                  onChange={(e) => {
                    if (activeEscrow) return;
                    setJoinEscrowAddress(e.target.value);
                    setJoinEscrowTouched(true);
                  }}
                  onBlur={() => setJoinEscrowTouched(true)}
                  readOnly={!!activeEscrow}
                  placeholder={lastEscrowAddress || "0xEscrowAddress"}
                  className={activeEscrow ? lockedFieldClass : editableFieldClass}
                />
                {!isJoinEscrowValid && joinEscrowTouched && (
                  <p className="text-xs text-red-500">Invalid escrow address.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Game ID
                </label>
                <Input
                  value={activeGameId || joinGameId}
                  onChange={(e) => {
                    if (activeGameId) return;
                    setJoinGameId(e.target.value);
                  }}
                  readOnly={!!activeGameId}
                  placeholder="0"
                  className={activeGameId ? lockedFieldClass : editableFieldClass}
                />
                {!isJoinGameIdValid && joinGameId !== "" && (
                  <p className="text-xs text-red-500">Game ID must be a number.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Bet (ETH)
                </label>
                <Input
                  value={joinBetAmount}
                  onChange={(e) => setJoinBetAmount(e.target.value)}
                  placeholder="0.0"
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {!isJoinBetValid && joinBetAmount !== "" && (
                  <p className="text-xs text-red-500">Bet must be greater than 0.</p>
                )}
              </div>
            </div>
            <Button
              type="button"
              onClick={handleJoinRpsGame}
              disabled={!canJoinRpsGame}
              className="w-full"
            >
              {isRpsJoinSubmitting ? "Joining on-chain match..." : "Join on-chain match"}
            </Button>
            {rpsTxState.action === "join" && rpsTxState.hash && (
              <p className="text-xs text-text-tertiary break-all">
                Tx: {rpsTxState.hash}
              </p>
            )}
            {rpsTxState.action === "join" && rpsTxState.error && (
              <p className="text-xs text-red-500">{rpsTxState.error}</p>
            )}
          </div>

          {/* [AGENT-GENERATED] Commit and reveal moves. */}
          <div className="mt-4 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Play your round
              </p>
              <p className="text-xs text-text-secondary">
                Commit a move with a secret salt, then reveal with the same salt.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Escrow contract
                </label>
                <Input
                  value={activeEscrow || playEscrowAddress}
                  onChange={(e) => {
                    if (activeEscrow) return;
                    setPlayEscrowAddress(e.target.value);
                  }}
                  readOnly={!!activeEscrow}
                  placeholder={lastEscrowAddress || "0xEscrowAddress"}
                  className={activeEscrow ? lockedFieldClass : editableFieldClass}
                />
                {!isPlayEscrowValid && playEscrowAddress && (
                  <p className="text-xs text-red-500">Invalid escrow address.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Game ID
                </label>
                <Input
                  value={activeGameId || playGameId}
                  onChange={(e) => {
                    if (activeGameId) return;
                    setPlayGameId(e.target.value);
                  }}
                  readOnly={!!activeGameId}
                  placeholder="0"
                  className={activeGameId ? lockedFieldClass : editableFieldClass}
                />
                {!isPlayGameIdValid && playGameId !== "" && (
                  <p className="text-xs text-red-500">Game ID must be a number.</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Move
                </label>
                <select
                  value={playMove}
                  onChange={(e) => setPlayMove(e.target.value as typeof playMove)}
                  className="h-10 rounded-md border border-border-primary bg-bg-tertiary text-text-primary text-sm px-3"
                >
                  <option value="">Select move</option>
                  <option value="rock">Rock</option>
                  <option value="paper">Paper</option>
                  <option value="scissors">Scissors</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Salt (keep secret)
                </label>
                <Input
                  value={playSalt}
                  onChange={(e) => setPlaySalt(e.target.value)}
                  placeholder="my-secret-salt or 0x... (32 bytes)"
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
                {!isPlaySaltValid && playSalt !== "" && (
                  <p className="text-xs text-red-500">Salt is required.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateSalt}
                    className="border-border-primary"
                  >
                    Generate salt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySalt}
                    className="border-border-primary"
                  >
                    {copiedSalt ? "Salt copied" : "Copy salt"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleCommitMove}
                disabled={!canCommitMove}
                className="border-border-primary"
              >
                {isRpsCommitSubmitting ? "Committing..." : "Commit move"}
              </Button>
              <Button
                type="button"
                onClick={handleRevealMove}
                disabled={!canRevealMove}
                className="border-border-primary"
              >
                {isRpsRevealSubmitting ? "Revealing..." : "Reveal move"}
              </Button>
            </div>
            {rpsTxState.action === "commit" && rpsTxState.hash && (
              <p className="text-xs text-text-tertiary break-all">
                Commit tx: {rpsTxState.hash}
              </p>
            )}
            {rpsTxState.action === "reveal" && rpsTxState.hash && (
              <p className="text-xs text-text-tertiary break-all">
                Reveal tx: {rpsTxState.hash}
              </p>
            )}
            {(rpsTxState.action === "commit" || rpsTxState.action === "reveal") &&
              rpsTxState.error && (
                <p className="text-xs text-red-500">{rpsTxState.error}</p>
              )}
            <div className="rounded-lg border border-border-primary bg-bg-secondary/60 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-tertiary">
                  Round status: {rpsGameStateLabel}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLoadRefereeGameInfo}
                  className="border-border-primary"
                >
                  Refresh
                </Button>
              </div>
              {refereeState.bestOf !== null && (
                <p className="text-xs text-text-tertiary">
                  Best of: {refereeState.bestOf}
                </p>
              )}
              {refereeState.round !== null && (
                <p className="text-xs text-text-tertiary">
                  Round: {refereeState.round}
                </p>
              )}
              {refereeState.winsP1 !== null && refereeState.winsP2 !== null && (
                <p className="text-xs text-text-tertiary">
                  Score: {refereeState.winsP1} - {refereeState.winsP2}
                </p>
              )}
            </div>
          </div>

          {/* [AGENT-GENERATED] Referee signature helper + game progress. */}
          <div className="mt-4 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Referee signature
              </p>
              <p className="text-xs text-text-secondary">
                Referee signs the final payout once the game is complete.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Escrow contract
                </label>
                <Input
                  value={activeEscrow || refEscrowAddress}
                  onChange={(e) => {
                    if (activeEscrow) return;
                    setRefEscrowAddress(e.target.value);
                  }}
                  readOnly={!!activeEscrow}
                  placeholder={lastEscrowAddress || "0xEscrowAddress"}
                  className={activeEscrow ? lockedFieldClass : editableFieldClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Game ID
                </label>
                <Input
                  value={activeGameId || refGameId}
                  onChange={(e) => {
                    if (activeGameId) return;
                    setRefGameId(e.target.value);
                  }}
                  readOnly={!!activeGameId}
                  placeholder="0"
                  className={activeGameId ? lockedFieldClass : editableFieldClass}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-semibold text-text-secondary">
                  Winner address
                </label>
                <Input
                  value={refWinner}
                  onChange={(e) => setRefWinner(e.target.value)}
                  placeholder="0xWinnerAddress"
                  className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLoadRefereeGameInfo}
                className="border-border-primary"
              >
                Load game info
              </Button>
              <Button
                type="button"
                onClick={handleSignReferee}
                className="border-border-primary"
              >
                {refereeState.status === "signing"
                  ? "Signing..."
                  : "Generate referee signature"}
              </Button>
            </div>
            <div className="rounded-lg border border-border-primary bg-bg-secondary/60 p-3 space-y-1">
              <p className="text-xs text-text-tertiary">
                Game status: {rpsGameStateLabel}
              </p>
              {refereeState.player1 && (
                <p className="text-xs text-text-tertiary break-all">
                  Player 1: {refereeState.player1}
                </p>
              )}
              {refereeState.player2 && (
                <p className="text-xs text-text-tertiary break-all">
                  Player 2: {refereeState.player2}
                </p>
              )}
              {refereePotEth && (
                <p className="text-xs text-text-tertiary">Pot: {refereePotEth} ETH</p>
              )}
              {refereeState.nonce && (
                <p className="text-xs text-text-tertiary">Nonce: {refereeState.nonce}</p>
              )}
              {refereeState.signature && (
                <div className="space-y-2">
                  <p className="text-xs text-text-tertiary break-all">
                    Signature: {refereeState.signature}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopySignature}
                    className="border-border-primary"
                  >
                    {copiedSignature ? "Copied" : "Copy signature"}
                  </Button>
                </div>
              )}
              {refereeState.error && (
                <p className="text-xs text-red-500">{refereeState.error}</p>
              )}
            </div>
          </div>

          {/* [Agent-Generated] Admin: set RPS implementation on SessionFactory. */}
          {(isOwner || showAdminTools) && (
            <div className="mt-4 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                    Admin · RPS implementation
                  </p>
                  <p className="text-xs text-text-secondary">
                    Only the SessionFactory owner can update it.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetImplementation}
                  disabled={!canSetImplementation}
                  className="border-border-primary"
                >
                  {isImplementationSubmitting ? "Updating..." : "Set impl"}
                </Button>
              </div>
              <Input
                value={implementationAddress}
                onChange={(e) => {
                  setImplementationAddress(e.target.value);
                  setImplementationTouched(true);
                }}
                onBlur={() => setImplementationTouched(true)}
                placeholder="0xRpsImplementation"
                className="text-sm bg-bg-tertiary border-border-primary text-text-primary"
              />
              {implementationError && (
                <p className="text-xs text-red-500">{implementationError}</p>
              )}
              {!isOwner && !isOwnerLoading && (
                <p className="text-xs text-amber-500">
                  Only the owner can perform this action.
                </p>
              )}
              {txState.action === "set-implementation" && (
                <div className="rounded-lg border border-border-primary bg-bg-secondary/60 p-3 space-y-1">
                  <p className="text-xs text-text-tertiary">
                    Status: {txState.status}
                  </p>
                  {txState.hash && (
                    <p className="text-xs text-text-tertiary break-all">
                      Tx: {txState.hash}
                    </p>
                  )}
                  {txState.error && (
                    <p className="text-xs text-red-500">{txState.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
          {!isOwner && !isOwnerLoading && (
            <p className="text-xs text-text-tertiary mt-2">
              Admin available only for the SessionFactory owner.
            </p>
          )}

          {/* [Agent-Generated] Game comparison area. */}
          <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-xl border border-border-primary bg-bg-secondary/70 p-4 text-center space-y-3">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Your wallet
              </p>
              <p className="text-sm text-text-primary font-mono">
                {currentEnsName ||
                  (currentAddress ? formatAddress(currentAddress) : "No wallet")}
              </p>
              <div className="flex justify-center">{rpsIcon(localMove)}</div>
              <p className="text-xs text-text-tertiary">
                {localMove ? `You chose ${localMove}` : "No selection"}
              </p>
            </div>

            <div className="text-center text-3xl font-bold text-text-primary">VS</div>

            <div className="rounded-xl border border-border-primary bg-bg-secondary/70 p-4 text-center space-y-3">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Opponent
              </p>
              <p className="text-sm text-text-primary font-mono">
                {opponentEnsName ||
                  (playerSlots[1]?.address
                    ? formatAddress(playerSlots[1].address)
                    : "Waiting for player")}
              </p>
              <div className="flex justify-center">{rpsIcon(null)}</div>
              <p className="text-xs text-text-tertiary">No selection</p>
            </div>
          </div>

          {!isOwnerLoading && !isOwner && (
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-xs text-text-tertiary space-y-1">
                <p>Admin available only for the SessionFactory owner.</p>
                {ownerAddress && (
                  <p className="break-all">
                    Owner: {ownerAddress}
                  </p>
                )}
                {currentAddress && (
                  <p className="break-all">
                    Current wallet: {currentAddress}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdminTools((prev) => !prev)}
                className="border-border-primary"
              >
                {showAdminTools ? "Hide admin" : "Show admin"}
              </Button>
            </div>
          )}

          {/* [Agent-Generated] RPS action buttons. */}
          <div className="mt-6 rounded-xl border border-border-primary bg-bg-tertiary/40 p-4">
            <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-3">
              Your move
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => setLocalMove("rock")}
                className="border-border-primary bg-bg-secondary/70 hover:bg-linear-to-br hover:from-gray-600 hover:to-gray-800 hover:border-gray-400 transition-all flex flex-col items-center justify-center gap-2 py-4"
              >
                <div className="relative w-12 h-12 rounded-full bg-linear-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg border-2 border-gray-400">
                  <span className="text-2xl">🪨</span>
                </div>
                <span className="text-sm font-semibold">Rock</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalMove("paper")}
                className="border-border-primary bg-bg-secondary/70 hover:bg-linear-to-br hover:from-blue-400 hover:to-blue-600 hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-2 py-4"
              >
                <div className="relative w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg border-2 border-blue-300">
                  <span className="text-2xl">📄</span>
                </div>
                <span className="text-sm font-semibold">Paper</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalMove("scissors")}
                className="border-border-primary bg-bg-secondary/70 hover:bg-linear-to-br hover:from-red-500 hover:to-red-700 hover:border-red-400 transition-all flex flex-col items-center justify-center gap-2 py-4"
              >
                <div className="relative w-12 h-12 rounded-full bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border-2 border-red-400">
                  <span className="text-2xl">✂️</span>
                </div>
                <span className="text-sm font-semibold">Scissors</span>
              </Button>
            </div>
          </div>

          {/* [Agent-Generated] Bet info + create session controls. */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-3">
              <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                Active bet
              </p>
              <p className="text-sm text-text-secondary">
                Required stake: {stakeEth || "0.0"} ETH
              </p>
              <p className="text-sm text-text-secondary">
                Your bet: {betAmount || "0"} ETH
              </p>
              {hasBalance && !isOverBalance && (
                <p className="text-xs text-text-tertiary">
                  Available balance: {balance} ETH
                </p>
              )}
              {isOverBalance && (
                <p className="text-xs text-red-500">
                  Amount exceeds your available balance.
                </p>
              )}
              {sessionError && (
                <p className="text-xs text-red-500">{sessionError}</p>
              )}
            </div>

            {flowMode === "create" && (
              <div className="rounded-xl border border-border-primary bg-bg-tertiary/40 p-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                    Bet amount (ETH)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      max={hasBalance ? balanceNum : undefined}
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      placeholder="0.000"
                      className="flex-1 text-lg font-bold bg-bg-tertiary border-border-primary text-text-primary"
                    />
                    <Button
                      onClick={handleMaxBetWithBalance}
                      variant="outline"
                      disabled={!hasBalance}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      MAX
                    </Button>
                  </div>
                  {isBalanceLoading && (
                    <p className="text-xs text-text-tertiary">
                      Loading balance...
                    </p>
                  )}
                  {!isBalanceLoading && !hasBalance && (
                    <p className="text-xs text-text-tertiary">
                      Connect your wallet to validate the balance.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((quick) => (
                    <Button
                      key={quick.value}
                      onClick={() => handleQuickAmount(quick.value)}
                      variant="outline"
                      disabled={
                        hasBalance && parseFloat(quick.value) > balanceNum
                      }
                      className="border-border-primary hover:border-primary/50 hover:bg-primary/10 text-text-primary"
                    >
                      {quick.label}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleBetWithBalance}
                  disabled={!canBet}
                  className="w-full h-14 text-lg font-bold bg-linear-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-darker transition-all duration-300 shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnimating || isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {txState.status === "signing"
                        ? "Signing..."
                        : txState.status === "pending"
                          ? "Confirming..."
                          : "Placing bet..."}
                    </span>
                  ) : (
                    `Bet ${betAmount || "0"} ETH`
                  )}
                </Button>

                <div className="rounded-lg border border-border-primary bg-bg-tertiary/40 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold">
                    Transaction status
                  </p>
                  <p className="text-sm text-text-secondary">
                    Active network: {SESSION_FACTORY_CHAIN.name}
                  </p>
                  <p className="text-sm text-text-secondary">
                    Status: {txState.status}
                  </p>
                  {txState.estimatedGas !== null && (
                    <p className="text-sm text-text-secondary">
                      Estimated gas: {txState.estimatedGas.toString()}
                    </p>
                  )}
                  {txState.hash && (
                    <p className="text-xs text-text-tertiary break-all">
                      Tx: {txState.hash}
                    </p>
                  )}
                  {txState.sessionId && (
                    <p className="text-xs text-text-tertiary break-all">
                      Session: {txState.sessionId}
                    </p>
                  )}
                  {txState.error && (
                    <p className="text-xs text-red-500">{txState.error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
