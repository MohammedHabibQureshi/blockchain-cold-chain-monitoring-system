import { ethers } from "ethers";
import { coldChainContract } from "./contract.js";


export async function recordTemperatureOnBlockchain(
    shipmentId: string,
    temperature: number,
    humidity?: number
) {

    console.log(
        "\n⛓️ Recording temperature on blockchain..."
    );

    console.log(
        "Shipment:",
        shipmentId
    );

    console.log(
        "Temperature:",
        temperature,
        "°C"
    );


    // ========================================
    // CREATE DATA HASH
    // ========================================

    const humidityValue =
        humidity ?? 60;

    const dataHash =
        ethers.keccak256(

            ethers.toUtf8Bytes(

                `${shipmentId}:${temperature}:${humidityValue}:${Date.now()}`

            )

        );


    console.log(
        "Data Hash:",
        dataHash
    );


    // ========================================
    // SEND TRANSACTION
    // ========================================

    const transaction =
        await coldChainContract.recordTemperature(
            shipmentId,
            temperature,
            humidityValue,
            dataHash
        );


    console.log(
        "Transaction submitted:"
    );

    console.log(
        transaction.hash
    );


    // ========================================
    // WAIT FOR BLOCKCHAIN CONFIRMATION
    // ========================================

    const receipt =
        await transaction.wait();


    console.log(
        "✅ Blockchain transaction confirmed"
    );

    console.log(
        "Block:",
        receipt?.blockNumber
    );


    return {

        transactionHash:
            transaction.hash,

        blockNumber:
            receipt?.blockNumber,

        dataHash

    };

}