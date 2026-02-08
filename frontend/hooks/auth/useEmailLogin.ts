import { useState, useCallback } from "react";
import { useLoginWithEmail, useCreateWallet } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export function useEmailLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  // [Agent-Generated] Used to force remount the Privy Captcha on errors.
  const [captchaKey, setCaptchaKey] = useState(0);

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
      console.error("Failed to send code:", error);
      // [Agent-Generated] Retry captcha if Privy reports captcha failure/timeout.
      const maybeCaptchaError = error as {
        privyErrorCode?: string;
        type?: string;
      };
      if (
        maybeCaptchaError?.type === "Captcha" ||
        maybeCaptchaError?.privyErrorCode?.startsWith("captcha")
      ) {
        setCaptchaKey((prev) => prev + 1);
        setStatusMessage("Captcha required. Please try again.");
      } else {
        setStatusMessage("Failed to send the code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, sendCode]);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage("Signing in...");

    try {
      // Log in with the code
      await loginWithCode({ code });
      setStatusMessage("Setting up your wallet...");

        // Create wallet, checking if it already exists
      try {
        await createWallet();
        setStatusMessage("Wallet ready! Redirecting...");
      } catch (walletError: unknown) {
        const errorMessage =
          walletError instanceof Error
            ? walletError.message
            : String(walletError);
        if (errorMessage.includes("already has")) {
          setStatusMessage("Welcome back!");
        } else {
          console.error("Failed to create wallet:", walletError);
          setStatusMessage("Signed in. Wallet pending.");
        }
      }

      // Redirect to home after all steps
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (error) {
      console.error("Failed to sign in:", error);
      setStatusMessage("Sign-in failed. Check the code.");
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
    captchaKey,
    handleSendCode,
    handleLogin,
    resetCodeForm,
  };
}
