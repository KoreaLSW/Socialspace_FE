import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const config = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24시간
    updateAge: 24 * 60 * 60, // 24시간마다 세션 갱신
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24시간
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true, // 개발 환경에서는 JavaScript 접근 허용
        sameSite: "lax", // 개발 환경에서는 lax로 설정
        secure: false, // 개발 환경에서는 false
        path: "/",
        domain: undefined, // 개발 환경에서는 도메인 설정 제거
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // 초기 로그인 시 Express 서버로 사용자 정보 전송 (DB 저장용)
      if (account?.provider === "google" && user) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL}/auth/google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                googleId: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              }),
            }
          );

          const data = await response.json();

          if (data.success) {
            console.log("Express 서버에 사용자 정보 전송 성공");

            // Express에서 받은 사용자 정보를 JWT 토큰에 저장
            const userData = data.data?.user;
            if (userData) {
              token.userId = userData.id;
              token.email = userData.email;
              token.username = userData.username;
              token.nickname = userData.nickname;
              token.bio = userData.bio;
              token.profileImage = userData.profileImage;
              token.isCustomProfileImage = userData.isCustomProfileImage;
              token.role = userData.role;
              token.emailVerified = userData.emailVerified;

              // Express 서버에서 기대하는 필드들도 설정
              token.sub = userData.id; // 표준 JWT subject 필드
              token.name = userData.nickname || userData.username;
            }
          } else {
            console.error("Express 서버 응답 실패:", data.message);
          }
        } catch (error) {
          console.error("Express 서버 요청 실패:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      // JWT 토큰의 사용자 정보를 세션에 추가
      if (token.userId) {
        (session.user as any).id = token.userId as string;
        (session.user as any).username = token.username as string;
        (session.user as any).nickname = token.nickname as string;
        (session.user as any).bio = token.bio as string;
        (session.user as any).profileImage = token.profileImage as string;
        (session.user as any).isCustomProfileImage =
          token.isCustomProfileImage as boolean;
        (session.user as any).role = token.role as string;
        (session.user as any).emailVerified = token.emailVerified as boolean;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development", // 개발 환경에서만 디버깅
  trustHost: process.env.NODE_ENV === "development", // 개발 환경에서만 자동 호스트 감지
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(config);
