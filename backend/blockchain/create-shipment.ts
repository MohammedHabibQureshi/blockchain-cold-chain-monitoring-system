import { coldChainContract } from "./contract.js";

async function main() {

    const shipmentId = "SHIP-001";

    const minTemperature = 2;

    const maxTemperature = 8;

    console.log("Creating shipment...");

    console.log("Shipment ID:", shipmentId);

    console.log("Minimum temperature:", minTemperature, "°C");

    console.log("Maximum temperature:", maxTemperature, "°C");

    try {

        const transaction =
            await coldChainContract.createShipment(
                shipmentId,
                minTemperature,
                maxTemperature
            );

        console.log(
            "Transaction hash:",
            transaction.hash
        );

        await transaction.wait();

        console.log("✅ Shipment created successfully");

        const shipment =
            await coldChainContract.getShipment(
                shipmentId
            );

        console.log("\nShipment information:");

        console.log("Shipment ID:", shipment[0]);

        console.log(
            "Manufacturer:",
            shipment[1]
        );

        console.log(
            "Current Custodian:",
            shipment[2]
        );

        console.log(
            "Minimum Temperature:",
            shipment[3].toString(),
            "°C"
        );

        console.log(
            "Maximum Temperature:",
            shipment[4].toString(),
            "°C"
        );

        console.log(
            "Created At:",
            shipment[5].toString()
        );

        console.log(
            "Active:",
            shipment[6]
        );

    } catch (error) {

        console.error(
            "❌ Shipment creation failed:"
        );

        console.error(error);

    }

}

main();