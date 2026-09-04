import { expect } from "chai";
import { ethers } from "hardhat";
import type { NFTCollection } from "../typechain-types";

describe("NFTCollection", () => {
  async function deploy() {
    const [owner, admin, user, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NFTCollection");
    const contract = (await Factory.deploy(
      owner.address,
      "NFT Collection",
      "NFTC",
      "https://example.com/metadata/{id}.json"
    )) as unknown as NFTCollection;
    await contract.waitForDeployment();
    return { contract, owner, admin, user, other };
  }

  it("sets name, symbol and default uri", async () => {
    const { contract } = await deploy();
    expect(await contract.name()).to.equal("NFT Collection");
    expect(await contract.symbol()).to.equal("NFTC");
    expect(await contract.uri(1)).to.equal("https://example.com/metadata/{id}.json");
  });

  it("allows the owner to mintBatch", async () => {
    const { contract, owner, user } = await deploy();
    await expect(contract.connect(owner).mintBatch(user.address, [1, 2], [1, 5], "0x"))
      .to.emit(contract, "TransferBatch");

    expect(await contract.balanceOf(user.address, 1)).to.equal(1);
    expect(await contract.balanceOf(user.address, 2)).to.equal(5);
    expect(await contract["totalSupply(uint256)"](1)).to.equal(1);
    expect(await contract["totalSupply(uint256)"](2)).to.equal(5);
  });

  it("allows the owner to mint a single token", async () => {
    const { contract, owner, user } = await deploy();
    await contract.connect(owner).mint(user.address, 3, 2, "0x");
    expect(await contract.balanceOf(user.address, 3)).to.equal(2);
  });

  it("reverts mintBatch/mint from non-owner (access control)", async () => {
    const { contract, user } = await deploy();
    await expect(
      contract.connect(user).mintBatch(user.address, [1], [1], "0x")
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");

    await expect(
      contract.connect(user).mint(user.address, 1, 1, "0x")
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("allows the owner to set a per-token uri override", async () => {
    const { contract, owner } = await deploy();
    await expect(contract.connect(owner).setTokenURI(1, "ipfs://token-1.json"))
      .to.emit(contract, "TokenURIUpdated")
      .withArgs(1, "ipfs://token-1.json");

    expect(await contract.uri(1)).to.equal("ipfs://token-1.json");
    // token without an override still falls back to the base uri
    expect(await contract.uri(2)).to.equal("https://example.com/metadata/{id}.json");
  });

  it("reverts setTokenURI from non-owner", async () => {
    const { contract, user } = await deploy();
    await expect(
      contract.connect(user).setTokenURI(1, "ipfs://nope.json")
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("allows the owner to pause and unpause transfers", async () => {
    const { contract, owner, user, other } = await deploy();
    await contract.connect(owner).mint(user.address, 1, 5, "0x");

    await contract.connect(owner).pause();
    await expect(
      contract.connect(user).safeTransferFrom(user.address, other.address, 1, 1, "0x")
    ).to.be.revertedWithCustomError(contract, "EnforcedPause");

    await contract.connect(owner).unpause();
    await contract.connect(user).safeTransferFrom(user.address, other.address, 1, 1, "0x");
    expect(await contract.balanceOf(other.address, 1)).to.equal(1);
  });

  it("reverts pause/unpause from non-owner", async () => {
    const { contract, user } = await deploy();
    await expect(contract.connect(user).pause()).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });
});
