export interface RegistrationState {
  status:
    | "idle"
    | "checking"
    | "committing"
    | "waiting"
    | "ready"
    | "registering"
    | "completed"
    | "error";
  label: string | null;
  commitment: string | null;
  secret: string | null;
  price: string | null;
  duration: number;
  waitTimeRemaining: number;
  txHash: string | null;
  error: string | null;
}

export interface UseRegisterENSResult {
  state: RegistrationState;
  checkAvailability: (label: string) => Promise<boolean>;
  getPrice: (label: string, duration: number) => Promise<string>;
  commitRegistration: (label: string, duration: number) => Promise<void>;
  completeRegistration: () => Promise<void>;
  setReverseRecord: (name: string) => Promise<void>;
  reset: () => void;
}

export type UseENSResult = {
  ensName?: string | null;
  ensAvatar?: string | null;
  isLoading: boolean;
  isError: boolean;
};
