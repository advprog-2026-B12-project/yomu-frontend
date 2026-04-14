"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthContextValue {
  username: string
  isLoading: boolean
  login: (token: string, username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleAutoLogout = useCallback((token: string) => {
    try {
      const payloadBase64 = token.split(".")[1]
      if (!payloadBase64) return
      const { exp } = JSON.parse(atob(payloadBase64))
      if (!exp) return
      const msUntilExpiry = exp * 1000 - Date.now()
      if (msUntilExpiry <= 0) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => logout(), msUntilExpiry)
    } catch {
      
    }
  }, [])

  const logout = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    setUsername("")
    router.push("/")
  }, [router])

  const login = useCallback((token: string, newUsername: string) => {
    localStorage.setItem("token", token)
    localStorage.setItem("username", newUsername)
    setUsername(newUsername)
    scheduleAutoLogout(token)
  }, [scheduleAutoLogout])

  useEffect(() => {
    const token = localStorage.getItem("token")
    const storedUsername = localStorage.getItem("username")

    if (!token || !storedUsername) {
      setIsLoading(false)
      return
    }

    try {
      const payloadBase64 = token.split(".")[1]
      if (!payloadBase64) throw new Error("Malformed token")
      const { exp } = JSON.parse(atob(payloadBase64))
      const nowSeconds = Math.floor(Date.now() / 1000)

      if (exp && exp < nowSeconds) {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        setIsLoading(false)
        return
      }

      setUsername(storedUsername)
      scheduleAutoLogout(token)
    } catch {
      localStorage.removeItem("token")
      localStorage.removeItem("username")
    }

    setIsLoading(false)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ username, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
