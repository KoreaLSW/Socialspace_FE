"use client";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileRedirectPage() {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    } else {
      router.replace("/auth/login");
    }
  }, [user, isLoading, router]);

  return null;
}
