"use client";

import { useEffect, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { VoucherNFTAbi, type Voucher } from "@nft-minting-gui/shared";
import { useSiweAuth } from "@/lib/useSiweAuth";
import { fetchClaimableVoucher } from "@/lib/api";

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`;

export function ClaimVoucher() {
  const { isConnected } = useAccount();
  const { token, signIn, isSigningIn, error: authError } = useSiweAuth();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isConnected && !token) {
      void signIn();
    }
  }, [isConnected, token, signIn]);

  useEffect(() => {
    if (!token) return;
    fetchClaimableVoucher(token)
      .then((res) => {
        if (res.claimable && res.voucher) {
          setVoucher(res.voucher);
        } else {
          setStatus(res.reason ?? "No voucher available.");
        }
      })
      .catch((err) => setStatus(err.message));
  }, [token]);

  function handleClaim() {
    if (!voucher) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: VoucherNFTAbi,
      functionName: "redeem",
      args: [
        {
          tokenId: BigInt(voucher.tokenId),
          recipient: voucher.recipient as `0x${string}`,
          uri: voucher.uri,
          expiresAt: BigInt(voucher.expiresAt),
          signature: voucher.signature as `0x${string}`,
        },
      ],
    });
  }

  if (!isConnected) return null;

  if (isSigningIn) return <p>Waiting for signature...</p>;
  if (authError) return <p>Sign-in error: {authError}</p>;

  if (isConfirmed) {
    return <p>🎉 Voucher claimed! Your NFT is now in your wallet.</p>;
  }

  return (
    <div>
      {voucher ? (
        <div className="voucher-card">
          <p>You have a voucher ready to claim.</p>
          <p>Token ID: {voucher.tokenId}</p>
          <button
            className="claim-btn"
            onClick={handleClaim}
            disabled={isPending || isConfirming}
          >
            {isPending || isConfirming ? "Claiming..." : "Claim NFT"}
          </button>
          {writeError && <p>Error: {writeError.message}</p>}
        </div>
      ) : (
        <p>{status ?? "Checking for available vouchers..."}</p>
      )}
    </div>
  );
}
