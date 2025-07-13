"use client";

import { createContext, useContext, ReactNode } from "react";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

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
  logout: () => Promise<{ success: boolean; error?: any }>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchUser: () => void;
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
  // Express 서버에서 사용자 정보 가져오기
  const { user, isLoading, refetch } = useCurrentUser();
  const { logout: apiLogout } = useLogout();

  const logout = async () => {
    try {
      const result = await apiLogout();
      if (result.success) {
        // 사용자 정보 새로고침
        refetch();
      }
      return result;
    } catch (error) {
      console.error("로그아웃 오류:", error);
      return { success: false, error };
    }
  };

  const value = {
    user,
    logout,
    isLoading,
    isAuthenticated: !!user,
    refetchUser: refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
