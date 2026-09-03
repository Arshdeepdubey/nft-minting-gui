import { Wallet } from "ethers";
import { VOUCHER_TYPES, type Voucher, type VoucherDomain } from "@nft-minting-gui/shared";
import { config } from "../config.js";

const minterWallet = new Wallet(config.minterPrivateKey);

function domain(): VoucherDomain {
  return {
    name: "VoucherNFT-Voucher",
    version: "1",
    chainId: config.chainId,
    verifyingContract: config.nftContractAddress,
  };
}

export interface UnsignedVoucher {
  tokenId: string;
  recipient: string;
  uri: string;
  expiresAt: number;
}

/** Signs a voucher with the minter's EIP-712 key. The contract verifies this on-chain. */
export async function signVoucher(unsigned: UnsignedVoucher): Promise<Voucher> {
  const signature = await minterWallet.signTypedData(domain(), VOUCHER_TYPES, {
    tokenId: unsigned.tokenId,
    recipient: unsigned.recipient,
    uri: unsigned.uri,
    expiresAt: unsigned.expiresAt,
  });

  return { ...unsigned, signature };
}

export function getMinterAddress(): string {
  return minterWallet.address;
}
