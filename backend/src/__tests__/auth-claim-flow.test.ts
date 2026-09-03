import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

// A well-known Hardhat test private key, used only to derive a treasury
// address for the "prepared tx" claim flow test below. Must be set before
// ../config (and anything importing it) is loaded.
process.env.ADMIN_PRIVATE_KEY ??=
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

import { createApp } from "../index";
import { User } from "../models/User";
import { NFT } from "../models/NFT";
import { NFTAssignment } from "../models/NFTAssignment";
import { issueTokens } from "../services/authService";

jest.setTimeout(60_000);

let mongod: MongoMemoryServer | undefined;
let app: ReturnType<typeof createApp>;

function bearer(token: string): string {
  return "Bearer " + token;
}

beforeAll(async () => {
  // Allow CI/sandboxed environments without internet access to a mongod
  // binary download to point at an already-running MongoDB instead.
  const externalUri = process.env.TEST_MONGO_URI;
  if (externalUri) {
    await mongoose.connect(externalUri);
  } else {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await NFT.deleteMany({});
  await NFTAssignment.deleteMany({});
});

describe("auth + claim flow (integration)", () => {
  it("rejects unauthenticated access to /user/nfts", async () => {
    const res = await request(app).get("/user/nfts");
    expect(res.status).toBe(401);
  });

  it("lists an unlocked NFT assignment and rejects claim without a linked wallet", async () => {
    const user = await User.create({
      email: "winner@example.com",
      name: "Winner",
      role: "user",
      ssoProvider: "google",
      ssoId: "google-123",
    });

    const admin = await User.create({
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      ssoProvider: "google",
      ssoId: "google-admin",
    });

    const nft = await NFT.create({
      tokenId: "1",
      contractAddress: "0x0000000000000000000000000000000000dead",
      name: "Test NFT",
      mintedBy: admin.id,
      status: "unlocked",
    });

    await NFTAssignment.create({
      nftId: nft.id,
      userId: user.id,
      status: "unlocked",
      unlockedAt: new Date(),
    });

    const { accessToken } = await issueTokens(user);

    const listRes = await request(app).get("/user/nfts").set("Authorization", bearer(accessToken));
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].nft.name).toBe("Test NFT");
    expect(listRes.body[0].assignment.status).toBe("unlocked");

    const claimRes = await request(app)
      .post(`/user/nfts/${nft.id}/claim`)
      .set("Authorization", bearer(accessToken))
      .send({});
    expect(claimRes.status).toBe(400);
    expect(claimRes.body.message).toMatch(/link your wallet/i);
  });

  it("returns a prepared transaction for claim once the wallet is linked", async () => {
    const admin = await User.create({
      email: "admin2@example.com",
      name: "Admin",
      role: "admin",
      ssoProvider: "google",
      ssoId: "google-admin-2",
    });

    const user = await User.create({
      email: "winner2@example.com",
      name: "Winner",
      role: "user",
      ssoProvider: "google",
      ssoId: "google-456",
      walletAddress: "0xf120cc4456751c64cb19df7e1bc27e2cda6b3624",
    });

    const nft = await NFT.create({
      tokenId: "2",
      contractAddress: "0x0000000000000000000000000000000000dead",
      name: "Test NFT 2",
      mintedBy: admin.id,
      status: "unlocked",
    });

    await NFTAssignment.create({
      nftId: nft.id,
      userId: user.id,
      status: "unlocked",
    });

    const { accessToken } = await issueTokens(user);

    const claimRes = await request(app)
      .post(`/user/nfts/${nft.id}/claim`)
      .set("Authorization", bearer(accessToken))
      .send({});

    expect(claimRes.status).toBe(200);
    expect(claimRes.body.mode).toBe("prepared_tx");
    expect(claimRes.body.preparedTx.data).toMatch(/^0x/);
  });

  it("blocks non-admins from the admin routes", async () => {
    const user = await User.create({
      email: "user3@example.com",
      name: "User",
      role: "user",
      ssoProvider: "google",
      ssoId: "google-789",
    });
    const { accessToken } = await issueTokens(user);

    const res = await request(app).get("/admin/nfts").set("Authorization", bearer(accessToken));
    expect(res.status).toBe(403);
  });
});
