import { coldChainContract, signer } from "./contract.js";

async function main() {
    console.log("Reading shipment from blockchain...");

    const shipmentId = "SHIP-001";

    try {
        const shipment =
            await coldChainContract.getShipment(shipmentId);

        console.log("\n==============================");
        console.log("SHIPMENT INFORMATION");
        console.log("==============================");

        // Convert Result to a normal array first
        const values = Array.from(shipment) as any[];

        console.log("Raw shipment result:");
        console.log(values);

        console.log("\nShipment ID:", values[0]);
        console.log("Manufacturer:", values[1]);
        console.log("Current Custodian:", values[2]);
        console.log(
            "Minimum Temperature:",
            values[3].toString(),
            "°C"
        );
        console.log(
            "Maximum Temperature:",
            values[4].toString(),
            "°C"
        );
        console.log(
            "Created At:",
            values[5].toString()
        );
        console.log(
            "Active:",
            values[6]
        );

        console.log("==============================");

    } catch (error) {
        console.error(
            "❌ Failed to read shipment:"
        );
        console.error(error);
    }
}

main();