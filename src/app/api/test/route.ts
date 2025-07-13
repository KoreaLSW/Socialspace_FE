import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL;

  console.log("✅ GOOGLE_CLIENT_ID:", clientId ?? "❌ 없음");
  console.log("✅ NEXT_PUBLIC_EXPRESS_SERVER_URL:", expressUrl ?? "❌ 없음");

  return new Response(
    JSON.stringify({
      GOOGLE_CLIENT_ID: clientId ?? "❌ 없음",
      EXPRESS_URL: expressUrl ?? "❌ 없음",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
