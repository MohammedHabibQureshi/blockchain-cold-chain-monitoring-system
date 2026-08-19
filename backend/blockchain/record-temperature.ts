import { ethers } from "ethers";
import { coldChainContract, signer } from "./contract.js";

async function main() {

    const shipmentId = "SHIP-001";

    const temperature = 5;

    const humidity = 60;

    const dataHash =
        ethers.keccak256(
            ethers.toUtf8Bytes(
                `${shipmentId}:${temperature}:${humidity}:${Date.now()}`
            )
        );

    console.log("\n# RECORD TEMPERATURE");

    console.log(
        "Recorder:",
        signer.address
    );

    console.log(
        "Contract:",
        await coldChainContract.getAddress()
    );

    console.log(
        "Shipment ID:",
        shipmentId
    );

    console.log(
        "Temperature:",
        temperature,
        "°C"
    );

    console.log(
        "Data Hash:",
        dataHash
    );

    console.log(
        "\nRecording temperature on blockchain..."
    );

    try {

        const tx =
            await coldChainContract.recordTemperature(
                shipmentId,
                temperature,
                humidity,
                dataHash
            );

        console.log(
            "Transaction hash:",
            tx.hash
        );

        await tx.wait();

        console.log(
            "✅ Temperature recorded successfully"
        );

    } catch (error) {

        console.error(
            "❌ Temperature recording failed:"
        );

        console.error(error);
    }
}

main();