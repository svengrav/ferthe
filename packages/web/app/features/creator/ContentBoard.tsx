import {
  adminApi,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from "@/app/api/adminClient.ts";
import { Page } from "@/app/components";
import { useEffect, useState } from "react";
import { MapEditor } from "./MapEditorLeaflet.tsx";

export function ContentBoard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existingToken = getAdminToken();
    if (existingToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Call dev-login endpoint with accountId
      const response = await fetch("/api/admin/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const result = await response.json();
      if (!result.success || !result.data?.sessionToken) {
        throw new Error("No session token received");
      }

      // Store session token
      setAdminToken(result.data.sessionToken);

      // Test token by fetching trails
      await adminApi.getTrails();
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      clearAdminToken();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAuthenticated(false);
    setAccountId("");
  };

  if (!isAuthenticated) {
    return (
      <Page title="Admin Login">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-center">Admin Login</h2>
              <p className="mt-2 text-center text-gray-400">
                Enter your Account ID to access your content
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-8 space-y-6">
              <div>
                <label htmlFor="accountId" className="sr-only">
                  Account ID
                </label>
                <input
                  id="accountId"
                  name="accountId"
                  type="text"
                  required
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Account ID (e.g., cm6abc123...)"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Content Board" className="h-screen overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <h1 className="text-2xl font-bold">Content Board</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <MapEditor />
        </div>
      </div>
    </Page>
  );
}
