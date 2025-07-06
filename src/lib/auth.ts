import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const config = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("😂😂😂signIn", user, account, profile);
      // 구글 로그인 성공 시 Express 서버로 정보 전송
      if (account?.provider === "google") {
        try {
          console.log("구글 로그인 성공, Express 서버로 정보 전송 중...");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL}/auth/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                googleId: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
              }),
            }
          );

          const data = await response.json();

          if (data.success) {
            console.log("Express 서버에 사용자 정보 전송 성공");
            return true;
          } else {
            console.error("Express 서버 응답 실패:", data.message);
            return false;
          }
        } catch (error) {
          console.error("Express 서버 요청 실패:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("🔑 JWT 콜백:", { token, user, account });
      // JWT 토큰에 사용자 정보 추가
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("👤 Session 콜백:", { session, token });
      // 세션에 사용자 정보 추가
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(config);
