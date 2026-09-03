import { useEffect, useState } from "react";
import type { NFTDTO } from "@nft-minting-gui/shared";
import { api } from "../lib/api";

export function AdminDashboard() {
  const [nfts, setNfts] = useState<NFTDTO[]>([]);
  const [userId, setUserId] = useState("");
  const [selectedNftId, setSelectedNftId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const list = await api.adminListNfts();
    setNfts(list);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleMint(id: string) {
    setMessage("Minting...");
    try {
      await api.adminMintNft(id);
      setMessage("Minted.");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Mint failed");
    }
  }

  async function handleAssign(id: string, unlock: boolean) {
    if (!userId) {
      setMessage("Enter a userId first");
      return;
    }
    setMessage("Assigning...");
    try {
      await api.adminAssignNft(id, userId, unlock);
      setMessage(unlock ? "Assigned and unlocked." : "Assigned (locked).");
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Assign failed");
    }
  }

  return (
    <div className="page admin-dashboard">
      <h1>Admin — NFTs</h1>
      {message && <p className="status">{message}</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Token ID</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {nfts.map((nft) => (
            <tr key={nft.id}>
              <td>{nft.name}</td>
              <td>{nft.tokenId}</td>
              <td>{nft.status}</td>
              <td>
                <button onClick={() => handleMint(nft.id)}>Mint</button>
                <button onClick={() => setSelectedNftId(nft.id)}>Select</button>
                {selectedNftId === nft.id && (
                  <>
                    <input
                      placeholder="winner userId"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                    <button onClick={() => handleAssign(nft.id, false)}>Assign (locked)</button>
                    <button onClick={() => handleAssign(nft.id, true)}>Assign + unlock</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
