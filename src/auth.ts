import NextAuth, { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "./lib/validator";
import { SECRET } from "./constants";
import { JwtPayload } from "./types/api";
import { jwtDecode } from "jwt-decode";
import { JWT } from "next-auth/jwt";
import { doRefreshToken, doSignIn } from "./app/actions/auth";

export const { auth, handlers, signIn, signOut } = NextAuth({
  debug: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        const parsedCredentials = signInSchema.safeParse(credentials);
        if (!parsedCredentials.success) {
          console.error("Invalid credentials:", parsedCredentials.error);
          return null;
        }

        try {
          const result = await doSignIn({
            email: parsedCredentials.data.email,
            password: parsedCredentials.data.password,
          });

          if (!result.success) {
            return null;
          }

          return {
            id: result.user!.id,
            username: result.user!.username,
            email: result.user!.email,
            displayName: result.user!.display_name,
            roles: result.user!.roles ?? [],
            phone: result.user?.phone,
            gender: result.user?.gender,
            accessToken: result.accessToken!,
            refreshToken: result.refreshToken!,
            accessExp: result.accessExp!,
            refreshExp: result.refreshExp!,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const now = Date.now();

      if (user) {
        const decoded = jwtDecode<JwtPayload>(user.accessToken);
        const refreshDecoded = jwtDecode<JwtPayload>(user.refreshToken);

        token.user = {
          id: Number(user.id),
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          roles: user.roles,
          phone: user.phone,
          gender: user.gender,
        };
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessExp =
          now + (Number(decoded.exp) - Number(decoded.iat)) * 1000;
        token.refreshExp =
          now +
          (Number(refreshDecoded.exp) - Number(refreshDecoded.iat)) * 1000;

        // Clear any previous error
        token.error = undefined;
        return token;
      }

      // Check if refresh token itself is expired
      if (token.refreshExp && now >= token.refreshExp) {
        console.log("[JWT] Refresh token expired - forcing logout");
        // Return null to force re-authentication
        return null;
      }

      // Check if access token needs refresh (with 2 second buffer)
      const refreshThreshold = 2000;
      if (token.accessExp && now >= token.accessExp - refreshThreshold) {
        if (token.refreshExp && now >= token.refreshExp) {
          token.error = "Refresh token expired";
          return token;
        }

        console.log("[JWT] Access token expired, attempting refresh...");
        try {
          const result = await doRefreshToken({
            refreshToken: token.refreshToken!,
          });
          if (result.success && result.accessToken && result.refreshToken) {
            console.log("[JWT] Token refresh successful - ROTATING TOKENS");

            const newAccessDecoded = jwtDecode<JwtPayload>(result.accessToken);
            const newRefreshDecoded = jwtDecode<JwtPayload>(
              result.refreshToken
            );

            // TOKEN ROTATION: Update BOTH tokens
            token.accessToken = result.accessToken;
            token.refreshToken = result.refreshToken;

            // Update expiration times
            token.accessExp =
              now +
              (Number(newAccessDecoded.exp) - Number(newAccessDecoded.iat)) *
                1000;
            token.refreshExp =
              now +
              (Number(newRefreshDecoded.exp) - Number(newRefreshDecoded.iat)) *
                1000;

            // Clear any errors
            token.error = undefined;

            console.log("[JWT] Token rotation complete:", {
              newAccessExp: new Date(token.accessExp).toISOString(),
              newRefreshExp: new Date(token.refreshExp).toISOString(),
            });
          } else {
            console.error("[JWT] Token refresh failed - invalid response");
            // Return null to force re-authentication instead of continuing with invalid state
            return null;
          }
        } catch (error) {
          console.error("[JWT] Token refresh error:", error);
          // Return null to force re-authentication
          return null;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("[SESSION] Building session:", { token });

      // If token is null (from jwt callback), session should be invalid
      if (!token || token.error) {
        console.log("[SESSION] Invalid token, returning empty session");
        return session;
      }

      if (token?.user) {
        session.user = token.user;
        session.accessToken = token.accessToken;
        session.accessExp = token.accessExp;
        session.refreshExp = token.refreshExp;
        session.refreshToken = token.refreshToken;
        session.error = token.error;
      }

      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  secret: SECRET,
  events: {
    // Optional: Add logging for debugging
    async signIn(message) {
      console.log("[AUTH EVENT] Sign in:", message.user?.email);
    },
    async signOut(message) {
      console.log("[AUTH EVENT] Sign out", message);
    },
    async session(message) {
      console.log("[AUTH EVENT] Session accessed", message);
    },
  },
});
