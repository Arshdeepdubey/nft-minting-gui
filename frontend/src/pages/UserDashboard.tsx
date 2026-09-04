import { useEffect, useState } from "react";
import type { UserNFTView } from "@nft-minting-gui/shared";
import { api } from "../lib/api";
import { ConnectWallet } from "../components/ConnectWallet";
import { ClaimNftCard } from "../components/ClaimNftCard";

export function UserDashboard() {
  const [nfts, setNfts] = useState<UserNFTView[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [me, list] = await Promise.all([api.me(), api.userNfts()]);
      setWalletAddress(me.walletAddress);
      setNfts(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="page dashboard">
      <h1>My NFTs</h1>
      <ConnectWallet onLinked={(address) => setWalletAddress(address)} />
      {walletAddress && <p>Linked wallet: {walletAddress}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : nfts.length === 0 ? (
        <p>No NFTs assigned yet. Check back after your next win!</p>
      ) : (
        <div className="nft-grid">
          {nfts.map((view) => (
            <ClaimNftCard key={view.assignment.id} view={view} onClaimed={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}
