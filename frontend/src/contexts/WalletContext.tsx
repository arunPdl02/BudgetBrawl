import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getBalance, getTransactions } from "../api/wallet";
import { useAuth } from "./AuthContext";

interface WalletContextValue {
  balance: number | null;
  transactions: unknown[];
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<unknown[]>([]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [bal, txns] = await Promise.all([getBalance(), getTransactions()]);
      setBalance(bal.balance);
      setTransactions(txns);
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WalletContext.Provider value={{ balance, transactions, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
