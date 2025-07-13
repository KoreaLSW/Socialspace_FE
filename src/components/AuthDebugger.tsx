"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function AuthDebugger() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("🔍 NextAuth 세션 상태:", {
      status,
      session,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      email: session?.user?.email,
      name: session?.user?.name,
    });

    // 쿠키 확인
    const cookies = document.cookie;
    console.log("🍪 현재 쿠키:", cookies);

    const sessionCookie = cookies
      .split("; ")
      .find((row) => row.startsWith("next-auth.session-token="));

    console.log("🔑 NextAuth 세션 쿠키:", sessionCookie ? "존재함" : "없음");

    if (sessionCookie) {
      console.log("🔑 세션 토큰 길이:", sessionCookie.split("=")[1]?.length);
    }
  }, [session, status]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#f0f0f0",
        padding: "10px",
        borderRadius: "5px",
        fontSize: "12px",
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <strong>🔍 Auth Debug Info:</strong>
      <br />
      Status: {status}
      <br />
      Session: {session ? "✅" : "❌"}
      <br />
      User ID: {(session?.user as any)?.id || "없음"}
      <br />
      Email: {session?.user?.email || "없음"}
      <br />
      Cookie:{" "}
      {document.cookie.includes("next-auth.session-token") ? "✅" : "❌"}
    </div>
  );
}
