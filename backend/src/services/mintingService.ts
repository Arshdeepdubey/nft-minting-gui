import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { NFTCollectionAbi } from "@nft-minting-gui/shared";
import { config } from "../config";
import { HttpError } from "../utils/HttpError";

function getSigner(): Wallet {
  if (!config.chain.adminPrivateKey) {
    throw HttpError.badRequest("Minting is not configured (missing ADMIN_PRIVATE_KEY env var)");
  }
  const provider = new JsonRpcProvider(config.chain.rpcUrl, config.chain.chainId);
  return new Wallet(config.chain.adminPrivateKey, provider);
}

/** Resolves the treasury/admin wallet address that currently holds unclaimed NFTs. */
export function getTreasuryAddress(): string {
  if (config.chain.treasuryAddress) {
    return config.chain.treasuryAddress;
  }
  if (config.chain.adminPrivateKey) {
    return new Wallet(config.chain.adminPrivateKey).address;
  }
  throw HttpError.badRequest(
    "No treasury address configured (set NFT_TREASURY_ADDRESS or ADMIN_PRIVATE_KEY)"
  );
}

function getContract(): Contract {
  if (!config.chain.nftContractAddress) {
    throw HttpError.badRequest("Minting is not configured (missing NFT_CONTRACT_ADDRESS env var)");
  }
  return new Contract(config.chain.nftContractAddress, NFTCollectionAbi as unknown as any[], getSigner());
}

/** Admin-triggered mint of a single NFT to the treasury/admin wallet (held until assigned/claimed). */
export async function mintNft(tokenId: string, amount = 1): Promise<string> {
  const contract = getContract();
  const signer = getSigner();
  const tx = await contract.mint(signer.address, tokenId, amount, "0x");
  const receipt = await tx.wait();
  return receipt.hash as string;
}

/** Transfers a single already-minted token from the admin/treasury wallet to a user's wallet. */
export async function transferNftToUser(tokenId: string, toAddress: string, amount = 1): Promise<string> {
  const contract = getContract();
  const signer = getSigner();
  const tx = await contract.safeTransferFrom(signer.address, toAddress, tokenId, amount, "0x");
  const receipt = await tx.wait();
  return receipt.hash as string;
}
