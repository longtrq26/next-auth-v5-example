"use client";

import { signOut, useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

const DashboardClient = () => {
  const { data: session, update } = useSession();

  const [timeLeftAccess, setTimeLeftAccess] = useState<number | null>(null);
  const [timeLeftRefresh, setTimeLeftRefresh] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("Idle");

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Cập nhật countdown và token mỗi giây
  useEffect(() => {
    const interval = setInterval(() => {
      if (!session) return;

      const now = Date.now();
      const accessMs = session.accessExp! - now;
      const refreshMs = session.refreshExp! - now;

      setTimeLeftAccess(Math.max(accessMs, 0));
      setTimeLeftRefresh(Math.max(refreshMs, 0));

      setAccessToken(session.accessToken || null);
      setRefreshToken(session.refreshToken || null);

      if (refreshMs <= 0) setStatus("Refresh token expired");
      else if (accessMs <= 0) setStatus("Access token expired");
      else setStatus("Active");
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Tự động refresh access token khi hết hạn (refresh token còn hạn)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!session) return;

      const now = Date.now();
      const accessMs = session.accessExp! - now;
      const refreshMs = session.refreshExp! - now;

      // Nếu refresh token hết hạn → logout
      if (refreshMs <= 0) {
        setStatus("Refresh token expired, logging out...");
        signOut({ redirect: true, callbackUrl: "/login" });
        return;
      }

      // Chỉ refresh access token khi access token hết hạn
      if (accessMs <= 0 && refreshMs > 0) {
        setStatus("Refreshing access token...");
        try {
          const updatedSession = await update(); // server trả session mới với rotating refresh token
          setStatus("Active (refreshed)");

          // Cập nhật token mới từ session trả về
          setAccessToken(updatedSession?.accessToken || null);
          setRefreshToken(updatedSession?.refreshToken || null);
        } catch {
          setStatus("Refresh failed, logging out...");
          signOut({ redirect: true, callbackUrl: "/login" });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, update]);

  const formatTime = (ms: number | null) => {
    if (ms === null) return "N/A";
    if (ms <= 0) return "Expired";
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
  };

  const getTimeColor = (ms: number | null) => {
    if (ms === null) return "text-gray-500";
    if (ms <= 0) return "text-red-600";
    if (ms <= 30000) return "text-red-600";
    if (ms <= 60000) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusColor = (status: string) => {
    if (status.includes("Error") || status.includes("expired"))
      return "text-red-600";
    if (status.includes("Refreshing")) return "text-yellow-600";
    if (status.includes("Active")) return "text-green-600";
    return "text-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <section className="grid gap-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4 text-lg">User Information</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-gray-500 text-sm">Full Name</dt>
              <dd className="text-gray-900">
                {session?.user?.displayName || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Username</dt>
              <dd className="text-gray-900">
                {session?.user?.username || "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Email</dt>
              <dd className="text-gray-900">{session?.user?.email || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Roles</dt>
              <dd className="text-gray-900">
                {session?.user?.roles?.join(", ") || "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Token Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4 text-lg">Token Status</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="font-medium">Current Status:</span>
              <span className={`font-bold text-lg ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Access Token</div>
                <div
                  className={`text-xl font-bold ${getTimeColor(
                    timeLeftAccess
                  )}`}
                >
                  {formatTime(timeLeftAccess)}
                </div>
                <textarea
                  readOnly
                  className="w-full mt-2 p-2 border rounded text-xs break-all"
                  value={accessToken || ""}
                  rows={3}
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Refresh Token</div>
                <div
                  className={`text-xl font-bold ${getTimeColor(
                    timeLeftRefresh
                  )}`}
                >
                  {formatTime(timeLeftRefresh)}
                </div>
                <textarea
                  readOnly
                  className="w-full mt-2 p-2 border rounded text-xs break-all"
                  value={refreshToken || ""}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardClient;
