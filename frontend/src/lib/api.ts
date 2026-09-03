import type { ClaimableVoucherResponse } from "@nft-minting-gui/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchNonce(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/nonce`);
  const data = await res.json();
  return data.nonce;
}

export async function verifySiwe(
  message: string,
  signature: string
): Promise<{ token: string; walletAddress: string }> {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  });
  if (!res.ok) throw new Error("SIWE verification failed");
  return res.json();
}

export async function fetchClaimableVoucher(
  token: string
): Promise<ClaimableVoucherResponse> {
  const res = await fetch(`${API_URL}/voucher/claimable`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch claimable voucher");
  return res.json();
}
