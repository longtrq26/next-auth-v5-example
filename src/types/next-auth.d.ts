import NextAuth, {
  User as DefaultUser,
  Session as DefaultSession,
} from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: number;
      username: string;
      email: string;
      displayName: string;
      roles: string[];
      phone?: string;
      gender?: string;
    };
    accessToken: string;
    accessExp?: number;
    refreshExp?: number;
    refreshToken?: string;
    error?: string;
  }

  interface User extends DefaultUser {
    id: number;
    username: string;
    email: string;
    displayName: string;
    roles: string[];
    phone?: string;
    gender?: string;
    accessToken: string;
    refreshToken: string;
    accessExp: number;
    refreshExp: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    user: {
      id: number;
      username: string;
      email: string;
      displayName: string;
      roles: string[];
      phone?: string;
      gender?: string;
    };
    accessToken: string;
    refreshToken: string;
    accessExp: number;
    refreshExp: number;
    error?: string;
  }
}
