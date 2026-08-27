import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // The minter signer is the address whose private key the backend
  // uses to sign vouchers (MINTER_PRIVATE_KEY in apps/api/.env).
  const minterSigner = process.env.MINTER_SIGNER_ADDRESS ?? deployer.address;

  const VoucherNFT = await ethers.getContractFactory("VoucherNFT");
  const contract = await VoucherNFT.deploy(deployer.address, minterSigner);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("VoucherNFT deployed to:", address);
  console.log("Minter signer set to:", minterSigner);
  console.log(
    "\nSet NFT_CONTRACT_ADDRESS and NEXT_PUBLIC_NFT_CONTRACT_ADDRESS to:",
    address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
