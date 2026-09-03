import { useState } from "react";
import { useSendTransaction } from "wagmi";
import type { UserNFTView } from "@nft-minting-gui/shared";
import { api } from "../lib/api";

export function ClaimNftCard({ view, onClaimed }: { view: UserNFTView; onClaimed: () => void }) {
  const { nft, assignment } = view;
  const { sendTransactionAsync } = useSendTransaction();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setError(null);
    setBusy(true);
    try {
      const result = await api.claimNft(nft.id);
      if (result.mode === "executed" && result.txHash) {
        onClaimed();
        return;
      }
      if (result.mode === "prepared_tx" && result.preparedTx) {
        const hash = await sendTransactionAsync({
          to: result.preparedTx.to as `0x${string}`,
          data: result.preparedTx.data as `0x${string}`,
        });
        await api.confirmClaim(nft.id, hash);
        onClaimed();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="nft-card">
      <img src={nft.imageUrl} alt={nft.name} width={160} height={160} />
      <h3>{nft.name}</h3>
      <span className={`badge badge-${assignment.status}`}>{assignment.status}</span>
      {assignment.status === "unlocked" && (
        <button onClick={handleClaim} disabled={busy}>
          {busy ? "Claiming..." : "Claim NFT"}
        </button>
      )}
      {assignment.status === "claimed" && assignment.claimTxHash && (
        <a
          href={`https://amoy.polygonscan.com/tx/${assignment.claimTxHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction
        </a>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
