import { ethers, run, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NFTCollection with account:", deployer.address);

  const name = process.env.NFT_NAME ?? "NFT Collection";
  const symbol = process.env.NFT_SYMBOL ?? "NFTC";
  const baseUri = process.env.NFT_BASE_URI ?? "https://example.com/metadata/{id}.json";
  const ownerAddress = process.env.NFT_OWNER_ADDRESS ?? deployer.address;

  const Factory = await ethers.getContractFactory("NFTCollection");
  const contract = await Factory.deploy(ownerAddress, name, symbol, baseUri);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("NFTCollection deployed to:", address);

  // Best-effort verification on PolygonScan (Amoy). Skipped on local networks
  // or if no explorer API key is configured.
  if (network.name !== "hardhat" && network.name !== "localhost" && process.env.POLYGONSCAN_API_KEY) {
    console.log("Waiting for block confirmations before verification...");
    await contract.deploymentTransaction()?.wait(5);
    try {
      await run("verify:verify", {
        address,
        constructorArguments: [ownerAddress, name, symbol, baseUri],
      });
    } catch (err) {
      console.warn("Verification failed (continuing):", err);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
