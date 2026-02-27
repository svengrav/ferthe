import { useNavigate } from "react-router-dom";
import { useCreatorAuth } from "../hooks/useCreatorAuth";

export function CreatorLogin() {
  const navigate = useNavigate();
  const {
    phoneNumber,
    setPhoneNumber,
    code: verificationCode,
    setCode: setVerificationCode,
    codeSent: showCodeInput,
    error,
    loading: isLoading,
    handleRequestCode,
    handleVerifyCode,
    handleBack,
  } = useCreatorAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Creator Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {!showCodeInput
            ? "Enter your phone number to receive a verification code"
            : "Enter the 6-digit code sent to your phone"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {!showCodeInput
            ? (
              <form onSubmit={handleRequestCode} className="space-y-6">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="mt-1">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+49 123 456789"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Your number will only be used for verification
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Sending..." : "Send SMS Code"}
                  </button>
                </div>
              </form>
            )
            : (
              <form
                onSubmit={(e) =>
                  handleVerifyCode(e, () => navigate("/admin/content"))}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-center text-2xl tracking-widest"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Code sent to {phoneNumber}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Development Mode
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-center text-gray-500">
              Use code <span className="font-mono font-semibold">123456</span>
              {" "}
              in development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
