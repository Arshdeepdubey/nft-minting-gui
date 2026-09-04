/** Roles a User can have. */
export type UserRole = "admin" | "user";

/** SSO providers supported for authentication. */
export type SsoProvider = "google" | "github";

/** Lifecycle status of an on-chain minted NFT record. */
export type NFTStatus = "minted" | "unlocked" | "claimed";

/** Lifecycle status of an NFT-to-user assignment. */
export type NFTAssignmentStatus = "locked" | "unlocked" | "claimed";

/** Mirrors the `User` Mongoose model in the backend. */
export interface UserDTO {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ssoProvider: SsoProvider;
  ssoId: string;
  walletAddress?: string;
  createdAt: string;
}

/** Mirrors the `NFT` Mongoose model in the backend. */
export interface NFTDTO {
  id: string;
  tokenId: string; // uint256 as string, avoids JS number precision loss
  contractAddress: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUri: string;
  mintedBy: string; // userId of the admin who triggered the mint
  mintTxHash?: string;
  status: NFTStatus;
  createdAt: string;
}

/** Mirrors the `NFTAssignment` Mongoose model in the backend. */
export interface NFTAssignmentDTO {
  id: string;
  nftId: string;
  userId: string;
  status: NFTAssignmentStatus;
  unlockedAt?: string;
  claimedAt?: string;
  claimTxHash?: string;
}

/** Response for `GET /user/nfts` — an assignment joined with its NFT. */
export interface UserNFTView {
  assignment: NFTAssignmentDTO;
  nft: NFTDTO;
}

/** Payload for the wallet-linking nonce flow (Phase 3). */
export interface WalletLinkNonceResponse {
  nonce: string;
  message: string;
}

export interface WalletLinkVerifyRequest {
  walletAddress: string;
  signature: string;
}

/** A prepared (unsigned) transaction returned to the frontend so the user
 * signs/submits it themselves via MetaMask, instead of custodial signing. */
export interface PreparedTransaction {
  to: string;
  data: string;
  value?: string;
  chainId: number;
}

export interface ClaimResponse {
  mode: "prepared_tx" | "executed";
  preparedTx?: PreparedTransaction;
  txHash?: string;
}
