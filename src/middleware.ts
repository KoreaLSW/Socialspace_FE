import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  // NextAuth 세션 확인
  const session = await auth();

  const { pathname } = req.nextUrl;

  // 인증이 필요하지 않은 페이지들
  const publicPaths = [
    "/auth/login",
    "/auth/signup",
    "/auth/error",
    "/api/auth",
    "/",
  ];

  // 공개 페이지는 항상 접근 허용
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 인증이 필요한 페이지인데 세션이 없으면 로그인 페이지로 리디렉션
  if (!session) {
    const signInUrl = new URL("/auth/login", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 경로에서 미들웨어 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
