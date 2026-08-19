import { ethers } from "ethers";
import fs from "fs";

async function main() {

    // ============================================
    // 1. CONNECT TO GANACHE
    // ============================================

    const provider = new ethers.JsonRpcProvider(
        "http://127.0.0.1:7545"
    );

    // ============================================
    // 2. GET GANACHE ACCOUNTS
    // ============================================

    const accounts = await provider.listAccounts();

    console.log("Ganache accounts:");

    for (let i = 0; i < accounts.length; i++) {
        console.log(i, accounts[i].address);
    }

    // ============================================
    // 3. ADMIN = ACCOUNT 1
    // ============================================

    const admin = accounts[0];

    // ============================================
    // 4. MANUFACTURER = ACCOUNT 2
    // ============================================

    const manufacturer = accounts[1];

    console.log("\nAdmin:");
    console.log(admin.address);

    console.log("\nManufacturer:");
    console.log(manufacturer.address);

    // ============================================
    // 5. LOAD CONTRACT ABI
    // ============================================

    const artifact = JSON.parse(
        fs.readFileSync(
            "./artifacts/contracts/ColdChain.sol/ColdChain.json",
            "utf8"
        )
    );

    // ============================================
    // 6. CONNECT TO COLDCHAIN CONTRACT
    // ============================================

    const coldChain = new ethers.Contract(
        "0x75fe54969850f7201221ee18dfb2DB5ba502f061",
        artifact.abi,
        admin
    );

    // ============================================
    // 7. REGISTER ACCOUNT 2
    // ============================================

    console.log("\nRegistering manufacturer...");

    const tx = await coldChain.registerUser(
        manufacturer.address,
        2
    );

    console.log("Transaction hash:");
    console.log(tx.hash);

    // ============================================
    // 8. WAIT FOR BLOCKCHAIN CONFIRMATION
    // ============================================

    const receipt = await tx.wait();

    console.log("\nTransaction confirmed!");

    console.log("Block number:");
    console.log(receipt?.blockNumber);

    // ============================================
    // 9. READ ROLE FROM BLOCKCHAIN
    // ============================================

    const role = await coldChain.roles(
        manufacturer.address
    );

    console.log("\nManufacturer role:");
    console.log(role.toString());

    // ============================================
    // 10. VERIFY
    // ============================================

    if (role.toString() === "2") {

        console.log(
            "\n✅ SUCCESS: Account 2 is registered as MANUFACTURER"
        );

    } else {

        console.log(
            "\n❌ ERROR: Manufacturer role was not registered"
        );
    }
}

main().catch((error) => {

    console.error("\n❌ Error:");
    console.error(error);

    process.exitCode = 1;
});