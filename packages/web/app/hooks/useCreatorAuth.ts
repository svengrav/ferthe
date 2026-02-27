import {
  api,
  clearAdminToken,
  getAdminAccountId,
  getAdminRole,
  getAdminToken,
  setAdminAccountId,
  setAdminRole,
  setAdminToken,
} from "@/app/api/adminClient.ts";
import { useEffect, useState } from "react";

const CREATOR_ROLES = ["creator", "admin"];

export function useCreatorAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existingToken = getAdminToken();
    const existingAccountId = getAdminAccountId();
    const existingRole = getAdminRole();
    if (existingToken && existingAccountId) {
      setAccountId(existingAccountId);
      setIsAuthenticated(true);
      setHasAccess(CREATOR_ROLES.includes(existingRole ?? ""));
    }
  }, []);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.account.requestSMSCode(phoneNumber);
      if (!result.success) throw new Error("Failed to send code");
      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent, onSuccess?: (accountId: string) => void) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.account.verifySMSCode(phoneNumber, code, "creator");
      if (!result.success || !result.data?.context?.sessionToken) {
        throw new Error((result as any).error?.message ?? "Verification failed");
      }
      const { sessionToken, accountId: verifiedAccountId } = result.data.context;
      const role = (result.data.context as any).role ?? "user";
      setAdminToken(sessionToken);
      setAdminAccountId(verifiedAccountId);
      setAdminRole(role);
      setAccountId(verifiedAccountId);
      setIsAuthenticated(true);
      setHasAccess(CREATOR_ROLES.includes(role));
      onSuccess?.(verifiedAccountId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCodeSent(false);
    setCode("");
    setError("");
  };

  const handleLogout = () => {
    clearAdminToken();
    setIsAuthenticated(false);
    setHasAccess(false);
    setAccountId("");
    setPhoneNumber("");
    setCode("");
    setCodeSent(false);
  };

  return {
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
  };
}
