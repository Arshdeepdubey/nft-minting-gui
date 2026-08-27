/** A "win" recorded by the game/platform backend that entitles a user to a voucher. */
export interface WinRecord {
  id: string;
  walletAddress: string;
  competitionName: string;
  wonAt: string; // ISO date
}

/** Voucher payload signed off-chain (EIP-712) and redeemed on-chain via VoucherNFT.redeem(). */
export interface Voucher {
  tokenId: string; // uint256 as string (avoid JS number precision loss)
  recipient: string; // wallet address
  uri: string; // token metadata URI, e.g. ipfs://...
  expiresAt: number; // unix seconds, 0 = never
  signature: string;
}

/** EIP-712 domain used for both signing (API) and verifying (contract/web). */
export interface VoucherDomain {
  name: "VoucherNFT-Voucher";
  version: "1";
  chainId: number;
  verifyingContract: string;
}

export const VOUCHER_TYPES = {
  Voucher: [
    { name: "tokenId", type: "uint256" },
    { name: "recipient", type: "address" },
    { name: "uri", type: "string" },
    { name: "expiresAt", type: "uint256" },
  ],
} as const;

export interface ClaimableVoucherResponse {
  claimable: boolean;
  voucher?: Voucher;
  reason?: string;
}
