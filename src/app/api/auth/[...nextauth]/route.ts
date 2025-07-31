import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// 디버깅을 위한 커스텀 핸들러
export async function GET(request: NextRequest) {
  try {
    const response = await handlers.GET(request);
    console.log("✅ NextAuth GET 응답:", response.status);
    return response;
  } catch (error) {
    console.error("❌ NextAuth GET 에러:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await handlers.POST(request);
    return response;
  } catch (error) {
    console.error("❌ NextAuth POST 에러:", error);
    throw error;
  }
}
