import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",

  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/nft_minting_gui",

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/auth/google/callback",
  },

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",

  chain: {
    chainId: Number(process.env.CHAIN_ID ?? 80002),
    rpcUrl: process.env.RPC_URL ?? "https://rpc-amoy.polygon.technology",
    nftContractAddress: process.env.NFT_CONTRACT_ADDRESS ?? "",
    adminPrivateKey: process.env.ADMIN_PRIVATE_KEY ?? "",
    treasuryAddress: process.env.NFT_TREASURY_ADDRESS ?? "",
  },

  ipfs: {
    pinataJwt: process.env.PINATA_JWT ?? "",
    pinataApiUrl: process.env.PINATA_API_URL ?? "https://api.pinata.cloud",
    pinataGatewayUrl: process.env.PINATA_GATEWAY_URL ?? "https://gateway.pinata.cloud/ipfs",
  },

  email: {
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? "",
    fromAddress: process.env.EMAIL_FROM ?? "no-reply@nft-minting-gui.local",
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  },
};

export { required };
