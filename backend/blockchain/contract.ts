import { ethers } from "ethers";
import "dotenv/config";
import fs from "fs";
import path from "path";

// ============================================
// CONFIGURATION
// ============================================

const RPC_URL = process.env.GANACHE_RPC_URL!;
const PRIVATE_KEY = process.env.GANACHE_PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.COLDCHAIN_CONTRACT!;

// ============================================
// PROVIDER
// ============================================

export const provider = new ethers.JsonRpcProvider(
    RPC_URL
);

// ============================================
// SIGNER
// ============================================

export const signer = new ethers.Wallet(
    PRIVATE_KEY,
    provider
);

// ============================================
// LOAD REAL HARDHAT ABI
// ============================================

const artifactPath = path.resolve(
    "..",
    "blockchain",
    "artifacts",
    "contracts",
    "ColdChain.sol",
    "ColdChain.json"
);

const artifact = JSON.parse(
    fs.readFileSync(artifactPath, "utf8")
);

const ABI = artifact.abi;

// ============================================
// CONTRACT
// ============================================

export const coldChainContract =
    new ethers.Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
    );

// ============================================
// DEBUG INFORMATION
// ============================================

console.log("✅ Provider created");

console.log(
    "👤 Signer address:",
    signer.address
);

console.log(
    "🌐 Contract:",
    CONTRACT_ADDRESS
);

console.log(
    "📜 ABI functions loaded:",
    ABI.filter(
        (item: any) => item.type === "function"
    ).map(
        (item: any) => item.name
    )
);