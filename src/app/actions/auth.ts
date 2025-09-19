"use server";

import { signOut } from "@/auth";
import { REFRESH_API, SIGNIN_API } from "@/constants";
import { parseExp } from "@/lib/utils";
import { LoginResponse } from "@/types/api";

export async function doSignIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  try {
    const res = await fetch(SIGNIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, error: "Failed to sign in" };
    }

    const data: LoginResponse = await res.json();

    if (!data.success || !data.token?.accessToken) {
      return { success: false, error: "Invalid sign in response" };
    }

    return {
      success: true,
      accessToken: data.token.accessToken,
      refreshToken: data.token.refreshToken,
      accessExp: parseExp(data.token.accessPayload.exp),
      refreshExp: parseExp(data.token.refreshPayload.exp),
      user: data.data,
    };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function doRefreshToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  try {
    const res = await fetch(REFRESH_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });

    if (!res.ok) {
      return { success: false, error: "Failed to refresh token" };
    }

    const data: LoginResponse = await res.json();

    if (!data.success || !data.token?.accessToken) {
      return { success: false, error: "Invalid refresh token response" };
    }

    return {
      success: true,
      accessToken: data.token.accessToken,
      refreshToken: data.token.refreshToken,
      accessExp: parseExp(data.token.accessPayload.exp),
      refreshExp: parseExp(data.token.refreshPayload.exp),
    };
  } catch (error) {
    console.error("Refresh token error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function doSignOut() {
  try {
    await signOut({ redirect: false });

    return { success: true, redirectTo: "/login" };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
