import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      timezone?: string;
    };
  }

  interface User {
    timezone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    timezone?: string;
  }
}
