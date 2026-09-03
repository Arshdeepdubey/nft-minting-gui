"use client";

import { useCallback, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { fetchNonce, verifySiwe } from "./api";

/**
 * Prompts the connected wallet to sign a SIWE message and exchanges it
 * for a session token (JWT) from the API. Call `signIn()` after the
 * wallet connects (e.g. from a button, or automatically via useEffect).
 */
export function useSiweAuth() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (!address || !chainId) return;
    setIsSigningIn(true);
    setError(null);
    try {
      const nonce = await fetchNonce();
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to claim your NFT voucher.",
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      });
      const message = siweMessage.prepareMessage();
      const signature = await signMessageAsync({ message });
      const { token: sessionToken } = await verifySiwe(message, signature);
      setToken(sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsSigningIn(false);
    }
  }, [address, chainId, signMessageAsync]);

  return { token, signIn, isSigningIn, error };
}
