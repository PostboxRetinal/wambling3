"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Label,
  Input,
} from "@/components/ui";
import { useWalletBalance } from "@/hooks/web3/useWallet";

export const TransactionDialog = ({
  onTransactionComplete,
}: {
  onTransactionComplete?: () => void;
} = {}) => {
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);

  const {
    handleSendTransaction,
    balance,
    transactionState,
    resetTransactionState,
    isValidAddress,
    isValidAmount,
  } = useWalletBalance();

  const isAddressValid = !address || isValidAddress(address);
  const isAmountValid = !amount || isValidAmount(amount);
  const canSubmit =
    address &&
    amount &&
    isAddressValid &&
    isAmountValid &&
    !transactionState.isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await handleSendTransaction({ to: address, amount });

      // Actualizar el balance del componente padre
      if (onTransactionComplete) {
        onTransactionComplete();
      }

      setAddress("");
      setAmount("");
      setOpen(false);
    } catch (error) {
      // El error ya se maneja en el hook con toast
      console.error("Error en la transacción:", error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setAddress("");
      setAmount("");
      resetTransactionState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-[200px] border-border-primary bg-bg-tertiary text-text-primary hover:bg-primary-dark"
        >
          Transferir fondos
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-bg-secondary p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-text-primary">
              Transferir Fondos
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm text-text-tertiary">
              Complete el formulario a continuación para transferir fondos a
              otra wallet.
            </DialogDescription>
          </DialogHeader>

          <form id="transaction-form" onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Dirección de la wallet</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x3RFD...D430"
                  className={!isAddressValid ? "border-red-500" : ""}
                />
                {!isAddressValid && (
                  <p className="mt-1 text-xs text-red-500">
                    Dirección inválida
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Cantidad a transferir</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00 ETH"
                  type="number"
                  step="0.000001"
                  min="0"
                  className={!isAmountValid ? "border-red-500" : ""}
                />
                {!isAmountValid && (
                  <p className="mt-1 text-xs text-red-500">Cantidad inválida</p>
                )}
                {balance && (
                  <p className="mt-1 text-xs text-text-tertiary">
                    Balance disponible: {parseFloat(balance).toFixed(6)} ETH
                  </p>
                )}
              </div>
            </div>
          </form>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={transactionState.isSubmitting}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form="transaction-form"
              variant="default"
              disabled={!canSubmit}
            >
              {transactionState.isSubmitting ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
