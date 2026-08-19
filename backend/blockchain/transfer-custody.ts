import { ethers } from "ethers";
import "dotenv/config";

import {
    provider,
    signer,
    coldChainContract
} from "./contract.js";

// ============================================
// CONFIGURATION
// ============================================

const SHIPMENT_ID = "SHIP-001";

// Ganache account used as transporter
const TRANSPORTER_ADDRESS =
    "0x6733120A9d49406086771C51DCb31483fF9B91Cd";

// ============================================
// MAIN
// ============================================

async function main() {

    console.log("\n# TRANSFER SHIPMENT CUSTODY\n");

    console.log(
        "Contract:",
        coldChainContract.target
    );

    console.log(
        "Current signer:",
        signer.address
    );

    console.log(
        "Shipment ID:",
        SHIPMENT_ID
    );

    console.log(
        "New custodian:",
        TRANSPORTER_ADDRESS
    );

    // ========================================
    // READ CURRENT SHIPMENT
    // ========================================

    console.log(
        "\nReading current shipment..."
    );

    const before =
        await coldChainContract
            .getShipment(SHIPMENT_ID);

    console.log(
        "Current custodian:",
        before[2]
    );

    // ========================================
    // CHECK IF ALREADY TRANSFERRED
    // ========================================

    if (
        before[2].toLowerCase() ===
        TRANSPORTER_ADDRESS.toLowerCase()
    ) {

        console.log(
            "\n⚠️ Shipment is already assigned to this transporter."
        );

        return;
    }

    // ========================================
    // TRANSFER CUSTODY
    // ========================================

    console.log(
        "\nTransferring custody..."
    );

    const tx =
        await coldChainContract
            .transferCustody(
                SHIPMENT_ID,
                TRANSPORTER_ADDRESS
            );

    console.log(
        "Transaction hash:",
        tx.hash
    );

    console.log(
        "Waiting for blockchain confirmation..."
    );

    const receipt =
        await tx.wait();

    console.log(
        "✅ Transaction confirmed"
    );

    console.log(
        "Block number:",
        receipt.blockNumber
    );

    // ========================================
    // VERIFY
    // ========================================

    console.log(
        "\nVerifying custody..."
    );

    const after =
        await coldChainContract
            .getShipment(SHIPMENT_ID);

    console.log(
        "\n=============================="
    );

    console.log(
        "CUSTODY TRANSFER RESULT"
    );

    console.log(
        "=============================="
    );

    console.log(
        "Shipment ID:",
        after[0]
    );

    console.log(
        "Manufacturer:",
        after[1]
    );

    console.log(
        "Previous Custodian:",
        before[2]
    );

    console.log(
        "New Custodian:",
        after[2]
    );

    console.log(
        "Active:",
        after[6]
    );

    console.log(
        "=============================="
    );

    // ========================================
    // FINAL CHECK
    // ========================================

    if (
        after[2].toLowerCase() ===
        TRANSPORTER_ADDRESS.toLowerCase()
    ) {

        console.log(
            "\n✅ CUSTODY TRANSFER SUCCESSFUL"
        );

    } else {

        console.log(
            "\n❌ CUSTODY TRANSFER VERIFICATION FAILED"
        );
    }
}

// ============================================
// RUN
// ============================================

main().catch((error) => {

    console.error(
        "\n❌ Custody transfer failed:"
    );

    console.error(error);

    process.exit(1);
});