"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { DiceIcon } from "@/components/ui/DiceIcon";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Manejo especial para rate limiting
        if (error.message?.includes("429") || error.message?.toLowerCase().includes("rate limit")) {
          toast.error("Demasiadas solicitudes", {
            description: "Por favor espera unos minutos antes de intentar de nuevo."
          });
          setLoading(false);
          return;
        }
        throw error;
      }
      
      toast.success("¡Enlace enviado!", {
        description: `Revisa tu email: ${email}`
      });
      setSent(true);
    } catch (err: Error | unknown) {
      toast.error("Error al enviar el email", {
        description: err instanceof Error ? err.message : "Intenta de nuevo"
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border-primary bg-bg-secondary p-10 shadow-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-dark text-4xl shadow-lg">
          📧
        </div>
        <h2 className="text-3xl font-bold text-primary">¡Revisa tu email!</h2>
        <p className="text-center text-lg text-text-primary">
          Te enviamos un link mágico a
        </p>
        <p className="text-xl font-semibold text-primary">{email}</p>
        <p className="text-sm text-text-secondary">
          Haz click en el enlace para iniciar sesión de forma segura
        </p>
        <button
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-4 text-sm text-primary transition-all hover:opacity-80 hover:underline"
        >
          ← Usar otro email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleLogin}
      className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border-primary bg-bg-secondary p-10 shadow-2xl"
    >
      <div className="text-center">
        <div className="mb-3 flex justify-center">
          <DiceIcon className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-primary">Iniciar sesión</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Accede a Wambling3 con tu email
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label
          htmlFor="email"
          className="text-sm font-medium text-text-primary"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="rounded-xl border border-border-primary bg-bg-tertiary px-4 py-3 text-text-primary placeholder:text-text-tertiary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-primary-dark px-6 py-4 font-semibold text-white shadow-lg transition-all hover:bg-primary-darker disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar enlace mágico"}
      </button>
    </form>
  );
}
