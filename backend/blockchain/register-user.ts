import { ethers } from "ethers";
import "dotenv/config";

const RPC_URL = process.env.GANACHE_RPC_URL!;
const PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.COLDCHAIN_CONTRACT!;

const provider = new ethers.JsonRpcProvider(RPC_URL);

const signer = new ethers.Wallet(
    PRIVATE_KEY,
    provider
);

const ABI = [
    "function registerUser(address user, uint8 role) external",
    "function roles(address user) external view returns (uint8)"
];

const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    signer
);

const manufacturerAddress =
    "0xFA57b736e0533741D8B576F59Ed787BACCAb4656";

async function main() {

    console.log("Admin:", await signer.getAddress());

    console.log(
        "Registering manufacturer:",
        manufacturerAddress
    );

    const tx =
        await contract.registerUser(
            manufacturerAddress,
            2
        );

    console.log(
        "Transaction hash:",
        tx.hash
    );

    await tx.wait();

    console.log(
        "✅ Manufacturer registered"
    );

    const role =
        await contract.roles(
            manufacturerAddress
        );

    console.log(
        "Manufacturer role:",
        role.toString()
    );

    console.log(
        "Expected role: 2 = MANUFACTURER"
    );
}

main().catch((error) => {

    console.error(
        "❌ Registration failed:"
    );

    console.error(error);

    process.exit(1);

});