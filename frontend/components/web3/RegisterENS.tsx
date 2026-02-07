"use client";

import { useState, useEffect } from "react";
import { useRegisterENS } from "@/hooks/web3/useRegisterENS";
import { Button, Card, CardContent, CardHeader, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

// [Agent-Generated] Duration options (in seconds).
const DURATION_OPTIONS = [
  { label: "1 year", value: 31536000 },
  { label: "2 years", value: 63072000 },
  { label: "3 years", value: 94608000 },
  { label: "5 years", value: 157680000 },
];

export const RegisterENS = () => {
  const {
    state,
    checkAvailability,
    getPrice,
    commitRegistration,
    completeRegistration,
    setReverseRecord,
    reset,
  } = useRegisterENS();

  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(31536000);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // [Agent-Generated] Handle label change with state reset.
  const handleLabelChange = (value: string) => {
    const newLabel = value.toLowerCase();
    setLabel(newLabel);
    
    if (newLabel.length < 3) {
      setIsAvailable(null);
      setEstimatedPrice(null);
    }
  };

  // [Agent-Generated] Check availability when label changes with debounce.
  useEffect(() => {
    if (label.length >= 3) {
      const timer = setTimeout(async () => {
        setIsCheckingAvailability(true);
        const available = await checkAvailability(label);
        setIsAvailable(available);
        
        if (available) {
          try {
            const price = await getPrice(label, duration);
            setEstimatedPrice(price);
          } catch {
            setEstimatedPrice(null);
          }
        } else {
          setEstimatedPrice(null);
        }
        setIsCheckingAvailability(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [label, duration, checkAvailability, getPrice]);

  // [Agent-Generated] Handle commit step.
  const handleCommit = async () => {
    if (!label || !isAvailable) return;
    await commitRegistration(label, duration);
  };

  // [Agent-Generated] Handle register step.
  const handleRegister = async () => {
    await completeRegistration();
  };

  // [Agent-Generated] Handle reverse record (optional).
  const handleSetReverse = async () => {
    if (!state.label) return;
    await setReverseRecord(`${state.label}.eth`);
  };

  // [Agent-Generated] Handle new registration.
  const handleNewRegistration = () => {
    reset();
    setLabel("");
    setIsAvailable(null);
    setEstimatedPrice(null);
  };

  return (
    <Card className="border-border-primary bg-bg-secondary/80 backdrop-blur-sm">
      <CardHeader>
        <h3 className="text-2xl font-bold text-text-primary">Register ENS Name</h3>
        <p className="text-sm text-text-tertiary">
          Get your .eth identity (commit-reveal required)
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* [Agent-Generated] Registration completed state */}
        {state.status === "completed" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="font-bold text-text-primary">
                  {state.label}.eth registered successfully! 🎉
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${state.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline flex items-center gap-1"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSetReverse}
                variant="outline"
                className="flex-1"
              >
                Set Reverse Record
              </Button>
              <Button onClick={handleNewRegistration} className="flex-1">
                Register Another
              </Button>
            </div>
          </div>
        )}

        {/* [Agent-Generated] Registration form */}
        {state.status !== "completed" && (
          <>
            {/* Label input */}
            <div className="space-y-2">
              <Label htmlFor="ens-label">ENS Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="ens-label"
                  placeholder="jaramillo"
                  value={label}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  disabled={state.status !== "idle"}
                  className="flex-1"
                />
                <span className="text-text-secondary font-mono">.eth</span>
              </div>

              {/* Availability indicator */}
              {isCheckingAvailability && (
                <p className="text-sm text-text-tertiary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Checking...
                </p>
              )}
              {isAvailable === true && (
                <p className="text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Available!
                </p>
              )}
              {isAvailable === false && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Already taken
                </p>
              )}
            </div>

            {/* Duration selector */}
            <div className="space-y-2">
              <Label htmlFor="duration">Registration Duration</Label>
              <Select
                value={duration.toString()}
                onValueChange={(val) => setDuration(parseInt(val))}
                disabled={state.status !== "idle"}
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price display */}
            {estimatedPrice && isAvailable && (
              <div className="p-4 bg-bg-primary/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">Estimated Cost</span>
                  <span className="text-lg font-bold text-primary">
                    {parseFloat(estimatedPrice).toFixed(4)} ETH
                  </span>
                </div>
              </div>
            )}

            {/* Commit step */}
            {state.status === "idle" && (
              <Button
                onClick={handleCommit}
                disabled={!label || !isAvailable || isCheckingAvailability}
                className="w-full"
              >
                Start Registration (Step 1: Commit)
              </Button>
            )}

            {/* Committing state */}
            {state.status === "committing" && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Committing...
              </Button>
            )}

            {/* Waiting state */}
            {state.status === "waiting" && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-sm text-text-primary mb-2">
                    ⏳ Waiting for commit confirmation...
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-1000"
                        style={{
                          width: `${((60 - state.waitTimeRemaining) / 60) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-mono text-text-primary">
                      {state.waitTimeRemaining}s
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={state.waitTimeRemaining > 0}
                  className="w-full"
                >
                  {state.waitTimeRemaining > 0
                    ? `Wait ${state.waitTimeRemaining}s...`
                    : "Complete Registration (Step 2)"}
                </Button>
              </div>
            )}

            {/* Ready state - countdown complete */}
            {state.status === "ready" && (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-sm text-green-500">
                    ✓ Commitment confirmed! You can now complete the registration.
                  </p>
                </div>
                <Button onClick={handleRegister} className="w-full">
                  Complete Registration (Step 2)
                </Button>
              </div>
            )}

            {/* Registering state */}
            {state.status === "registering" && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Minting your ENS...
              </Button>
            )}

            {/* Error state */}
            {state.status === "error" && state.error && (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-500">{state.error}</p>
                </div>
                <Button onClick={handleNewRegistration} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}

        {/* Info footer */}
        <div className="pt-4 border-t border-border-primary/30">
          <p className="text-xs text-text-tertiary">
            ℹ️ ENS registration requires 2 transactions: commit (prevents front-running)
            + register (mints your .eth NFT). 60s wait required between steps.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
