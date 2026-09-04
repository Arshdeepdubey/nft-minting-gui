import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { useState } from "react";
import { api } from "../lib/api";
import { polygonAmoy } from "../lib/wagmiConfig";

export function ConnectWallet({ onLinked }: { onLinked?: (address: string) => void }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wrongNetwork = isConnected && chainId !== polygonAmoy.id;

  async function handleLinkWallet() {
    if (!address) return;
    setError(null);
    setStatus("Requesting nonce...");
    try {
      const { message } = await api.walletNonce();
      setStatus("Please sign the message in your wallet...");
      const signature = await signMessageAsync({ message });
      setStatus("Verifying signature...");
      const result = await api.walletVerify(address, signature);
      setStatus(null);
      onLinked?.(result.walletAddress);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : "Failed to link wallet");
    }
  }

  if (!isConnected) {
    return (
      <div className="connect-wallet">
        {connectors.map((connector) => (
          <button key={connector.uid} disabled={isPending} onClick={() => connect({ connector })}>
            Connect {connector.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="connect-wallet">
      <p>
        Connected: <code>{address}</code>
      </p>
      {wrongNetwork && (
        <button onClick={() => switchChain({ chainId: polygonAmoy.id })}>Switch to Polygon Amoy</button>
      )}
      {!wrongNetwork && (
        <button onClick={handleLinkWallet} disabled={status !== null}>
          Link wallet to account
        </button>
      )}
      <button onClick={() => disconnect()}>Disconnect</button>
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
