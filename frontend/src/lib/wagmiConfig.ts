import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const polygonAmoy = defineChain({
  id: Number(import.meta.env.VITE_CHAIN_ID ?? 80002),
  name: "Polygon Amoy",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_URL ?? "https://rpc-amoy.polygon.technology"] },
  },
  blockExplorers: {
    default: { name: "PolygonScan", url: "https://amoy.polygonscan.com" },
  },
  testnet: true,
});

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  connectors: [injected()],
  transports: {
    [polygonAmoy.id]: http(),
  },
});
