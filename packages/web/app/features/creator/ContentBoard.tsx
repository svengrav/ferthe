import { Page } from "@/app/components";
import { useCreatorAuth } from "@/app/hooks/useCreatorAuth.ts";
import { MapEditor } from "./MapEditorLeaflet.tsx";

export function ContentBoard() {
  const {
    isAuthenticated,
    hasAccess,
    accountId,
    phoneNumber,
    setPhoneNumber,
    code,
    setCode,
    codeSent,
    error,
    loading,
    handleRequestCode,
    handleVerifyCode,
    handleBack,
    handleLogout,
  } = useCreatorAuth();

  if (!isAuthenticated) {
    return (
      <Page title="Admin Login" wide>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-center">Admin Login</h2>
              <p className="mt-2 text-center text-gray-400">
                {codeSent
                  ? "Enter the code sent to your phone"
                  : "Enter your phone number to receive a code"}
              </p>
            </div>

            {!codeSent
              ? (
                <form onSubmit={handleRequestCode} className="mt-8 space-y-6">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-white focus:outline-none focus:ring-2"
                    placeholder="+49 123 456789"
                  />
                  {error && (
                    <div className="text-danger text-sm text-center">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-gray-700 focus:outline-none disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Code"}
                  </button>
                </form>
              )
              : (
                <form onSubmit={handleVerifyCode} className="mt-8 space-y-6">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-white focus:outline-none focus:ring-2"
                    placeholder="Verification code"
                  />
                  {error && (
                    <div className="text-danger text-sm text-center">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-gray-700 focus:outline-none disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full text-sm text-gray-400 hover:text-gray-200"
                  >
                    Back
                  </button>
                </form>
              )}
          </div>
        </div>
      </Page>
    );
  }

  if (isAuthenticated && !hasAccess) {
    return (
      <Page title="Access Denied" wide>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-2xl font-bold text-danger">Access Denied</h2>
          <p className="mt-2 text-gray-400">
            Your account does not have creator or admin access.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page className="h-screen overflow-hidden" wide headerWide>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-300">
          <h1 className="text-2xl font-bold">Content Board</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 cursor-pointer"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <MapEditor accountId={accountId} />
        </div>
      </div>
    </Page>
  );
}
