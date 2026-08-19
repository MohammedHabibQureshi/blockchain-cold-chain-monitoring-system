import { ethers } from "ethers";
import fs from "fs";

async function main() {
  // Connect directly to Ganache
  const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:7545"
  );

  // Get Ganache accounts
  const accounts = await provider.listAccounts();

  console.log("Ganache accounts:");
  console.log(accounts);

  // Get first account
  const signer = await provider.getSigner(accounts[0].address);

  console.log("\nDeploying from:");
  console.log(await signer.getAddress());

  // Read compiled TestDeploy artifact
  const artifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/TestDeploy.sol/TestDeploy.json",
      "utf8"
    )
  );

  // Create contract factory
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer
  );

  console.log("\nDeploying TestDeploy...");

  const contract = await factory.deploy();

  console.log("Transaction hash:");
  console.log(contract.deploymentTransaction()?.hash);

  await contract.waitForDeployment();

  console.log("\n✅ Contract deployed!");
  console.log("Contract address:");
  console.log(await contract.getAddress());

  console.log("\nStored value:");
  console.log(await contract.value());
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:");
  console.error(error);
  process.exitCode = 1;
});