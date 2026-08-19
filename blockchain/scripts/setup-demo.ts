import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider(
    "http://127.0.0.1:7545"
  );

  const [admin] = await provider.listAccounts();

  const deployment = JSON.parse(
    fs.readFileSync(
      "./deployment/deployment.json",
      "utf8"
    )
  );

  const contractAddress = deployment.contractAddress;

  const artifact = JSON.parse(
    fs.readFileSync(
      "./artifacts/contracts/ColdChain.sol/ColdChain.json",
      "utf8"
    )
  );

  const contract = new ethers.Contract(
    contractAddress,
    artifact.abi,
    admin
  );

  console.log("Admin:", admin.address);
  console.log("Contract:", contractAddress);

  const registrations: Array<[string, number, string]> = [
    ["0xFA57b736e0533741D8B576F59Ed787BACCAb4656", 2, "MANUFACTURER"],
    ["0x198d2C6056FBd854DB466EB1b3cCEf50405dAdf9", 3, "TRANSPORTER"],
    ["0x9fB4279A0cE93327914498150c76361862643c87", 4, "WAREHOUSE"],
    ["0x52779856074C31787150E35608EaE627ebcb10A0", 5, "DISTRIBUTOR"],
    ["0xD4E629ceA86b68F0E699521Fd54D3969CBeDC4dA", 6, "HOSPITAL"],
  ];

  for (const [address, role, roleName] of registrations) {
    const current = await contract.roles(address);

    if (current.toString() === role.toString()) {
      console.log(`Already registered ${address} as ${roleName}`);
      continue;
    }

    const tx = await contract.registerUser(address, role);

    await tx.wait();

    console.log(`✅ Registered ${address} as ${roleName}`);
  }

  console.log("\nRole verification:");

  for (const [address, role, roleName] of registrations) {
    const current = await contract.roles(address);
    console.log(`  ${address}: ${current.toString()} (expected ${role} ${roleName})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
