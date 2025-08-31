import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      username: string;
      nickname: string;
      bio?: string;
      profileImage?: string;
      isCustomProfileImage: boolean;
      visibility?: string;
      followApprovalMode?: string;
      showMutualFollow?: boolean;
      role: string;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    username?: string;
    nickname?: string;
    bio?: string;
    profileImage?: string;
    isCustomProfileImage?: boolean;
    visibility?: string;
    followApprovalMode?: string;
    showMutualFollow?: boolean;
    role?: string;
    emailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
    username?: string;
    nickname?: string;
    bio?: string;
    profileImage?: string;
    isCustomProfileImage?: boolean;
    visibility?: string;
    followApprovalMode?: string;
    showMutualFollow?: boolean;
    role?: string;
    emailVerified?: boolean;
  }
}
