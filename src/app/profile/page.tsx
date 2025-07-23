"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileRedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user?.username) {
      router.replace(`/profile/${session.user.username}`);
    } else {
      router.replace("/auth/login");
    }
  }, [session, status, router]);

  return null;
}
