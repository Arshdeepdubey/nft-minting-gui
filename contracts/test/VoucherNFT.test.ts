import { expect } from "chai";
import { ethers } from "hardhat";
import type { Signer } from "ethers";

describe("VoucherNFT", () => {
  async function signVoucher(
    signer: Signer,
    contractAddress: string,
    chainId: bigint,
    voucher: {
      tokenId: number;
      recipient: string;
      uri: string;
      expiresAt: number;
    }
  ) {
    const domain = {
      name: "VoucherNFT-Voucher",
      version: "1",
      chainId,
      verifyingContract: contractAddress,
    };
    const types = {
      Voucher: [
        { name: "tokenId", type: "uint256" },
        { name: "recipient", type: "address" },
        { name: "uri", type: "string" },
        { name: "expiresAt", type: "uint256" },
      ],
    };
    return signer.signTypedData(domain, types, voucher);
  }

  it("mints on valid voucher redemption", async () => {
    const [owner, minterSigner, user] = await ethers.getSigners();

    const VoucherNFT = await ethers.getContractFactory("VoucherNFT");
    const contract = await VoucherNFT.deploy(
      await owner.getAddress(),
      await minterSigner.getAddress()
    );
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const network = await ethers.provider.getNetwork();

    const voucher = {
      tokenId: 1,
      recipient: await user.getAddress(),
      uri: "ipfs://example-metadata-1",
      expiresAt: 0,
    };

    const signature = await signVoucher(
      minterSigner,
      contractAddress,
      network.chainId,
      voucher
    );

    await expect(
      contract.connect(user).redeem({ ...voucher, signature })
    )
      .to.emit(contract, "VoucherRedeemed")
      .withArgs(voucher.tokenId, voucher.recipient);

    expect(await contract.ownerOf(voucher.tokenId)).to.equal(voucher.recipient);
    expect(await contract.tokenURI(voucher.tokenId)).to.equal(voucher.uri);
  });

  it("rejects a voucher signed by a non-minter", async () => {
    const [owner, minterSigner, user, attacker] = await ethers.getSigners();

    const VoucherNFT = await ethers.getContractFactory("VoucherNFT");
    const contract = await VoucherNFT.deploy(
      await owner.getAddress(),
      await minterSigner.getAddress()
    );
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const network = await ethers.provider.getNetwork();

    const voucher = {
      tokenId: 2,
      recipient: await user.getAddress(),
      uri: "ipfs://example-metadata-2",
      expiresAt: 0,
    };

    const badSignature = await signVoucher(
      attacker,
      contractAddress,
      network.chainId,
      voucher
    );

    await expect(
      contract.connect(user).redeem({ ...voucher, signature: badSignature })
    ).to.be.revertedWith("VoucherNFT: invalid signature");
  });

  it("prevents double redemption", async () => {
    const [owner, minterSigner, user] = await ethers.getSigners();

    const VoucherNFT = await ethers.getContractFactory("VoucherNFT");
    const contract = await VoucherNFT.deploy(
      await owner.getAddress(),
      await minterSigner.getAddress()
    );
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const network = await ethers.provider.getNetwork();

    const voucher = {
      tokenId: 3,
      recipient: await user.getAddress(),
      uri: "ipfs://example-metadata-3",
      expiresAt: 0,
    };

    const signature = await signVoucher(
      minterSigner,
      contractAddress,
      network.chainId,
      voucher
    );

    await contract.connect(user).redeem({ ...voucher, signature });

    await expect(
      contract.connect(user).redeem({ ...voucher, signature })
    ).to.be.revertedWith("VoucherNFT: already redeemed");
  });
});
