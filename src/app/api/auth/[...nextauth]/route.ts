import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// 기본 NextAuth 핸들러 사용
export const { GET, POST } = handlers;

// 필요시 커스텀 핸들러로 확장 가능
// export async function GET(request: NextRequest) {
//   console.log("NextAuth GET 요청:", request.url);
//   return handlers.GET(request);
// }

// export async function POST(request: NextRequest) {
//   console.log("NextAuth POST 요청:", request.url);
//   return handlers.POST(request);
// }
