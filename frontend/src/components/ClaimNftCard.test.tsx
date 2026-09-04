import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import type { UserNFTView } from "@nft-minting-gui/shared";
import { ClaimNftCard } from "./ClaimNftCard";
import { wagmiConfig } from "../lib/wagmiConfig";

function renderWithProviders(view: UserNFTView) {
  const queryClient = new QueryClient();
  return render(
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ClaimNftCard view={view} onClaimed={() => {}} />
      </QueryClientProvider>
    </WagmiProvider>,
  );
}

function makeView(status: "locked" | "unlocked" | "claimed"): UserNFTView {
  return {
    nft: {
      id: "nft-1",
      tokenId: "1",
      contractAddress: "0x0000000000000000000000000000000000dEaD",
      name: "Test NFT",
      description: "A test NFT",
      imageUrl: "https://example.com/image.png",
      metadataUri: "ipfs://test",
      mintedBy: "admin-1",
      status: "minted",
      createdAt: new Date().toISOString(),
    },
    assignment: {
      id: "assignment-1",
      nftId: "nft-1",
      userId: "user-1",
      status,
      claimTxHash: status === "claimed" ? "0xabc123" : undefined,
    },
  };
}

describe("ClaimNftCard", () => {
  it("shows a claim button when the assignment is unlocked", () => {
    renderWithProviders(makeView("unlocked"));
    expect(screen.getByRole("button", { name: /claim nft/i })).toBeInTheDocument();
  });

  it("does not show a claim button when locked", () => {
    renderWithProviders(makeView("locked"));
    expect(screen.queryByRole("button", { name: /claim nft/i })).not.toBeInTheDocument();
  });

  it("shows a PolygonScan link when claimed", () => {
    renderWithProviders(makeView("claimed"));
    expect(screen.getByRole("link", { name: /view transaction/i })).toHaveAttribute(
      "href",
      "https://amoy.polygonscan.com/tx/0xabc123",
    );
  });
});
