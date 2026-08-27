# nft-minting-gui

Open-source NFT minting web app: users connect a wallet, and if they have a
recent "win" recorded by your platform, they can claim a signed voucher that
mints an ERC-721 NFT directly into their wallet (lazy minting — they pay
their own gas, you pay none until claim).

## Stack (all OSS)

| Layer            | Tool                                                   |
|-------------------|--------------------------------------------------------|
| Smart contract    | Solidity, OpenZeppelin, Hardhat                        |
| Contract lib      | ethers.js v6                                            |
| Backend           | Node.js, TypeScript, Fastify, Prisma, PostgreSQL        |
| Auth              | Sign-In With Ethereum (siwe) + JWT                      |
| Frontend          | Next.js, React, TypeScript                              |
| Wallet connect    | wagmi, viem, RainbowKit                                  |

## Repository structure

```
nft-minting-gui/
├── contracts/              # Hardhat project — VoucherNFT.sol, tests, deploy script
├── apps/
│   ├── api/                 # Fastify backend — SIWE auth, voucher signing, Prisma/Postgres
│   └── web/                 # Next.js frontend — wallet connect + claim flow
├── packages/
│   └── shared/               # Shared TS types + contract ABI (used by api & web)
├── package.json              # npm workspaces root
└── .env.example
```

## How it works

1. Your platform calls `POST /internal/wins` when a user wins something.
2. User visits the web app, connects their wallet, signs a SIWE message to
   authenticate.
3. Web app calls `GET /voucher/claimable` — API signs an EIP-712 voucher
   (tokenId + metadata URI + expiry) tied to that win, using `MINTER_PRIVATE_KEY`.
4. User clicks "Claim NFT" — the frontend calls `VoucherNFT.redeem(voucher)`
   directly on-chain. The contract verifies the signature and mints. No gas
   cost to you until someone actually claims.

## Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL running locally (or update `DATABASE_URL`)
- A wallet + testnet RPC (e.g. Sepolia via a public RPC or Alchemy/Infura)

### 2. Install
```bash
npm install
cp .env.example .env
# fill in .env: DEPLOYER_PRIVATE_KEY, RPC_URL, MINTER_PRIVATE_KEY, DATABASE_URL, etc.
```

### 3. Contracts
```bash
npm run compile:contracts
npm run test:contracts
npm run --workspace=contracts deploy:sepolia
# copy the printed contract address into apps/api/.env (NFT_CONTRACT_ADDRESS)
# and apps/web/.env.local (NEXT_PUBLIC_NFT_CONTRACT_ADDRESS)
```

After compiling, copy the generated ABI into the shared package so both
apps use the real one instead of the checked-in placeholder:
```bash
cp contracts/artifacts/contracts/VoucherNFT.sol/VoucherNFT.json \
   packages/shared/src/abi/VoucherNFT.json
```
(You'll want just the `abi` field from that file — trim it down, as the
build artifact also includes bytecode you don't need client-side.)

### 4. Database
```bash
cd apps/api
cp .env.example .env
npm run prisma:migrate
```

### 5. Run
```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

## Security notes

- `MINTER_PRIVATE_KEY` signs vouchers — keep it server-side only, never in
  the frontend.
- Protect `POST /internal/wins` (not exposed to end users) with a
  reverse-proxy allowlist or shared-secret header in production.
- SIWE nonces are stored in-memory for simplicity — swap for Redis in a
  multi-instance deployment.
- Rotate `minterSigner` on the contract via `setMinterSigner` if the key
  is ever compromised.

## License

MIT — see [LICENSE](./LICENSE).
