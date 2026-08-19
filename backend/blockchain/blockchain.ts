import { ethers } from "ethers";

import {
    BLOCKCHAIN_RPC_URL,
    PRIVATE_KEY,
    COLDCHAIN_CONTRACT_ADDRESS
} from "./config.js";

import ColdChainABI from "./ColdChainABI.json" with { type: "json" };


// ========================================
// PROVIDER
// ========================================

export const provider =
    new ethers.JsonRpcProvider(
        BLOCKCHAIN_RPC_URL
    );


// ========================================
// READ-ONLY CONTRACT
// ========================================

export const coldChainContract =
    new ethers.Contract(
        COLDCHAIN_CONTRACT_ADDRESS,
        ColdChainABI,
        provider
    );


// ========================================
// BLOCKCHAIN SIGNER
// ========================================

if (!PRIVATE_KEY) {

    throw new Error(
        "PRIVATE_KEY is not configured in .env"
    );

}

export const signer =
    new ethers.Wallet(
        PRIVATE_KEY,
        provider
    );


// ========================================
// WRITE-ENABLED CONTRACT
// ========================================

export const writableColdChainContract =
    new ethers.Contract(
        COLDCHAIN_CONTRACT_ADDRESS,
        ColdChainABI,
        signer
    );