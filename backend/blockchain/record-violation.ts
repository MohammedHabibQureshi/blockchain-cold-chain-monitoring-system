import { ethers } from "ethers";
import { coldChainContract, signer } from "./contract.js";

// ============================================
// CONFIGURATION
// ============================================

const SHIPMENT_ID = "SHIP-001";

// Deliberately unsafe temperature
const TEMPERATURE = 10;

// ============================================
// MAIN
// ============================================

async function main() {

    console.log("\n# TEMPERATURE VIOLATION TEST\n");

    console.log(
        "Recorder:",
        signer.address
    );

    console.log(
        "Contract:",
        coldChainContract.target
    );

    console.log(
        "Shipment ID:",
        SHIPMENT_ID
    );

    console.log(
        "Temperature:",
        TEMPERATURE,
        "°C"
    );

    console.log(
        "Expected:",
        "🚨 VIOLATION"
    );

    // ============================================
    // CREATE DATA HASH
    // ============================================

    const humidity = 72;

    const dataHash =
        ethers.keccak256(
            ethers.toUtf8Bytes(
                `${SHIPMENT_ID}-${TEMPERATURE}-${humidity}-${Date.now()}`
            )
        );

    console.log(
        "Data Hash:",
        dataHash
    );

    // ============================================
    // RECORD TEMPERATURE
    // ============================================

    try {

        console.log(
            "\nRecording unsafe temperature..."
        );

        const tx =
            await coldChainContract.recordTemperature(
                SHIPMENT_ID,
                TEMPERATURE,
                humidity,
                dataHash
            );

        console.log(
            "Transaction hash:",
            tx.hash
        );

        await tx.wait();

        console.log(
            "✅ Unsafe temperature recorded"
        );

        console.log(
            "🚨 Temperature violation should now exist"
        );

    } catch (error) {

        console.error(
            "\n❌ Temperature violation recording failed:"
        );

        console.error(error);

    }
}

main();