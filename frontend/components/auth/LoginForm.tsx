"use client";

import { useEffect, useRef } from "react";
import { DiceIcon } from "@/components/common/DiceIcon";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
} from "@/components/ui";
import { useEmailLogin } from "@/hooks/auth/useEmailLogin";
import { Captcha } from "@privy-io/react-auth";

export function LoginForm() {
  const {
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
  } = useEmailLogin();

  const lastProcessedCode = useRef<string>("");

  useEffect(() => {
    if (code.length === 6 && !isLoading && code !== lastProcessedCode.current) {
      lastProcessedCode.current = code;
      handleLogin();
    }
  }, [code, isLoading, handleLogin]);

  useEffect(() => {
    if (code.length < 6) {
      lastProcessedCode.current = "";
    }
  }, [code]);

  return (
    <Card className="w-full max-w-md border-border-primary bg-bg-secondary shadow-2xl">
      <CardHeader className="text-center">
        <div className="mb-3 flex justify-center">
          <DiceIcon className="h-16 w-16 text-primary" />
        </div>
        <CardTitle className="text-3xl text-primary">Iniciar sesión</CardTitle>
        <CardDescription className="text-text-secondary">
          {statusMessage ||
            (isCodeSent
              ? "Revisa tu email e ingresa el código"
              : "Accede a Wambling3 con tu email")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {!isCodeSent ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-text-primary">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              disabled={isLoading}
              required
              className="h-11 border-border-primary bg-bg-tertiary text-text-primary placeholder:text-text-tertiary"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-3 text-center">
              <Label className="text-text-primary text-base">
                Enviado a{" "}
                <span className="text-text-secondary font-medium">{email}</span>
              </Label>
            </div>
            <div className="flex justify-center w-full py-2">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={isLoading}
                containerClassName="gap-3"
              >
                <InputOTPGroup>
                  <InputOTPSlot
                    index={0}
                    className="w-12 h-14 text-lg font-semibold border-border-primary bg-bg-tertiary text-text-primary transition-all"
                  />
                  <InputOTPSlot
                    index={1}
                    className="w-12 h-14 text-lg font-semibold border-border-primary bg-bg-tertiary text-text-primary transition-all"
                  />
                  <InputOTPSlot
                    index={2}
                    className="w-12 h-14 text-lg font-semibold border-border-primary bg-bg-tertiary text-text-primary transition-all"
                  />
                  <InputOTPSlot
                    index={3}
                    className="w-12 h-14 text-lg font-semibold border-border-primary bg-bg-tertiary text-text-primary transition-all"
                  />
                  <InputOTPSlot
                    index={4}
                    className="w-12 h-14 text-lg font-semibold border-border-primary bg-bg-tertiary text-text-primary transition-all"
                  />
                  <InputOTPSlot
                    index={5}
                    className="w-12 h-14 text-lg font-semibold border-border-primary bg-bg-tertiary text-text-primary transition-all"
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        )}

        {!isCodeSent ? (
          <Button
            type="button"
            onClick={handleSendCode}
            disabled={!email || isLoading}
            size="lg"
            className="bg-primary-dark hover:bg-primary-darker"
          >
            {isLoading ? "Enviando..." : "Enviar código"}
          </Button>
        ) : (
          <div className="flex flex-col gap-3 mt-2">
            <Button
              type="button"
              onClick={handleLogin}
              disabled={code.length !== 6 || isLoading}
              size="lg"
              className="bg-primary-dark hover:bg-primary-darker"
            >
              {isLoading
                ? statusMessage || "Verificando..."
                : "Verificar código"}
            </Button>
            <Button
              type="button"
              onClick={resetCodeForm}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            >
              ← Cambiar email
            </Button>
          </div>
        )}

        {/* [Agent-Generated] Privy CAPTCHA mount point (key forces remount on errors) */}
        <div className="flex justify-center">
          <Captcha key={captchaKey} />
        </div>
      </CardContent>
    </Card>
  );
}
