import { useState, useCallback } from "react";
import { useLoginWithEmail, useCreateWallet } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export function useEmailLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { createWallet } = useCreateWallet();
  const router = useRouter();

  const handleSendCode = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage("");
    try {
      await sendCode({ email });
      setIsCodeSent(true);
      setStatusMessage("");
    } catch (error) {
      console.error("Error al enviar código:", error);
      setStatusMessage("Error al enviar el código. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [email, sendCode]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage("Iniciando sesión...");

    try {
      // Login con el código
      await loginWithCode({ code });
      setStatusMessage("Configurando tu wallet...");

      // Crear wallet verificando si ya existe
      try {
        await createWallet();
        setStatusMessage("¡Wallet lista! Redirigiendo...");
      } catch (walletError: unknown) {
        const errorMessage =
          walletError instanceof Error
            ? walletError.message
            : String(walletError);
        if (errorMessage.includes("already has")) {
          setStatusMessage("¡Bienvenido de vuelta!");
        } else {
          console.error("Error creando wallet:", walletError);
          setStatusMessage("Sesión iniciada. Wallet pendiente.");
        }
      }

      // Redirigir al home después de todo
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setStatusMessage("Error al iniciar sesión. Verifica el código.");
      setIsLoading(false);
    }
  }, [code, loginWithCode, createWallet, router]);

  const resetCodeForm = useCallback(() => {
    setIsCodeSent(false);
    setCode("");
    setStatusMessage("");
  }, []);

  return {
    email,
    setEmail,
    code,
    setCode,
    isCodeSent,
    isLoading,
    statusMessage,
    handleSendCode,
    handleLogin,
    resetCodeForm,
  };
}
