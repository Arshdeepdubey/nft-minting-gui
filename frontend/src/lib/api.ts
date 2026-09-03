import type { NFTAssignmentDTO, NFTDTO, UserNFTView } from "@nft-minting-gui/shared";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const accessToken = getAccessToken();
  const authHeaders: Record<string, string> = accessToken
    ? { Authorization: "Bearer " + accessToken }
    : {};
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    clearTokens();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const tokens = await res.json();
    setTokens(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export function googleLoginUrl(): string {
  return `${API_URL}/auth/google`;
}

export const api = {
  me: () => request<{ id: string; email: string; name: string; role: string; walletAddress: string | null }>(
    "/auth/me"
  ),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  walletNonce: () => request<{ nonce: string; message: string }>("/auth/wallet/nonce", { method: "POST" }),
  walletVerify: (walletAddress: string, signature: string) =>
    request<{ walletAddress: string }>("/auth/wallet/verify", {
      method: "POST",
      body: JSON.stringify({ walletAddress, signature }),
    }),
  userNfts: () => request<UserNFTView[]>("/user/nfts"),
  claimNft: (id: string) =>
    request<{ mode: string; txHash?: string; preparedTx?: { to: string; data: string; chainId: number } }>(
      `/user/nfts/${id}/claim`,
      { method: "POST", body: JSON.stringify({}) }
    ),
  confirmClaim: (id: string, txHash: string) =>
    request<NFTAssignmentDTO>(`/user/nfts/${id}/claim/confirm`, {
      method: "POST",
      body: JSON.stringify({ txHash }),
    }),
  adminListNfts: () => request<NFTDTO[]>("/admin/nfts"),
  adminAssignNft: (id: string, userId: string, unlock: boolean) =>
    request<unknown>(`/admin/nfts/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId, unlock }),
    }),
  adminMintNft: (id: string) => request<NFTDTO>(`/admin/nfts/${id}/mint`, { method: "POST" }),
};

export { ApiError };
