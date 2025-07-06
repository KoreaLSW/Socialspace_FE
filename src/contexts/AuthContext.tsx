"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSession, signOut } from "next-auth/react";

interface User {
  id: string;
  email: string;
  username: string;
  nickname: string;
  bio?: string;
  profileImage?: string;
  visibility: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      // NextAuth 세션에서 사용자 정보 가져오기
      const sessionUser = {
        id: session.user.id || "",
        email: session.user.email || "",
        username: session.user.name || "",
        nickname: session.user.name || "",
        profileImage: session.user.image || "",
        visibility: "public",
        role: "user",
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(sessionUser);
    } else {
      setUser(null);
    }

    setIsLoading(false);
  }, [session, status]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // NextAuth 로그아웃
      await signOut({ redirect: false });

      // Express 서버에 로그아웃 요청 (쿠키 삭제를 위해)
      await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }

    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
