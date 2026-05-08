"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";

export interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  role?: string;
}

interface AuthContextValue {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  isLoading: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LS_KEYS = ["token", "userId", "username", "displayName", "role"] as const;

function clearStorage() {
  LS_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoLogout = useCallback((token: string) => {
    try {
      const payloadBase64 = token.split(".")[1];
      if (!payloadBase64) return;
      const { exp } = JSON.parse(atob(payloadBase64));
      if (!exp) return;
      const msUntilExpiry = exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => logout(), msUntilExpiry);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearStorage();
    setUserId("");
    setUsername("");
    setDisplayName("");
    setRole("");
    router.push("/");
  }, [router]);

  const login = useCallback(
    (token: string, user: UserInfo) => {
      if (!user.username)
        throw new Error("login() called with missing username");
      const userRole = user.role ?? "";
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.userId);
      localStorage.setItem("username", user.username);
      localStorage.setItem("displayName", user.displayName);
      localStorage.setItem("role", userRole);
      setUserId(user.userId);
      setUsername(user.username);
      setDisplayName(user.displayName);
      setRole(userRole);
      scheduleAutoLogout(token);
    },
    [scheduleAutoLogout],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUserId = localStorage.getItem("userId") ?? "";
    const storedUsername = localStorage.getItem("username") ?? "";
    const storedDisplayName = localStorage.getItem("displayName") ?? "";
    const storedRole = localStorage.getItem("role") ?? "";

    if (!token || !storedUsername) {
      setIsLoading(false);
      return;
    }

    try {
      const payloadBase64 = token.split(".")[1];
      if (!payloadBase64) throw new Error("Malformed token");
      const { exp } = JSON.parse(atob(payloadBase64));
      const nowSeconds = Math.floor(Date.now() / 1000);

      if (exp && exp < nowSeconds) {
        clearStorage();
        setIsLoading(false);
        return;
      }

      setUserId(storedUserId);
      setUsername(storedUsername);
      setDisplayName(storedDisplayName);
      setRole(storedRole);
      scheduleAutoLogout(token);
    } catch {
      clearStorage();
    }

    setIsLoading(false);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}
    >
      <AuthContext.Provider
        value={{
          userId,
          username,
          displayName,
          role,
          isLoading,
          login,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
