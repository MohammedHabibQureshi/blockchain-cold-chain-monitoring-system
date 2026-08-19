import { ethers } from "ethers";
import fs from "fs";

async function main() {
  // Connect to Ganache
  const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:7545"
  );

  // Get Ganache accounts
  const accounts = await provider.listAccounts();

  console.log("Ganache accounts:");
  console.log(accounts);

  // Use first Ganache account
  const signer = await provider.getSigner(accounts[0].address);

  console.log("\nDeploying ColdChain from:");
  console.log(await signer.getAddress());

  // Load ColdChain compiled artifact
  const artifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/ColdChain.sol/ColdChain.json",
      "utf8"
    )
  );

  // Create contract factory
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  console.log("\nDeploying ColdChain...");

  // Deploy
  const contract = await factory.deploy();

  console.log("\nTransaction hash:");
  console.log(contract.deploymentTransaction()?.hash);

  // Wait for deployment
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("\n=================================");
  console.log("✅ ColdChain deployed successfully");
  console.log("=================================");

  console.log("Contract address:");
  console.log(address);

  // Verify admin
  const admin = await contract.admin();

  console.log("\nAdmin:");
  console.log(admin);

  // Verify deployer's role
  const role = await contract.roles(await signer.getAddress());

  console.log("\nDeployer role:");
  console.log(role.toString());

  console.log("\nExpected:");
  console.log("Role 1 = ADMIN");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});