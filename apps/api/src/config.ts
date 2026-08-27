import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  minterPrivateKey: required("MINTER_PRIVATE_KEY"),
  nftContractAddress: required("NFT_CONTRACT_ADDRESS"),
  chainId: Number(process.env.CHAIN_ID ?? 11155111),
  jwtSecret: required("JWT_SECRET"),
  siweDomain: process.env.SIWE_DOMAIN ?? "localhost:3000",
  siweOrigin: process.env.SIWE_ORIGIN ?? "http://localhost:3000",
};
