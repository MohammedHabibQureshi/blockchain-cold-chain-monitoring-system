import {
    coldChainContract
} from "./contract.js";

// ============================================
// VERIFY TEMPERATURE
// ============================================

async function main() {

    console.log("\n# VERIFY TEMPERATURE\n");

    console.log(
        "Contract:",
        process.env.COLDCHAIN_CONTRACT
    );

    console.log(
        "\nReading temperature data from blockchain..."
    );

    try {

        // ============================================
        // GET NUMBER OF READINGS
        // ============================================

        const count =
            await coldChainContract
                .getTemperatureReadingCount();

        console.log(
            "\nTemperature readings stored:",
            count.toString()
        );

        // ============================================
        // NO DATA
        // ============================================

        if (count === 0n) {

            console.log(
                "\nNo temperature readings found."
            );

            return;
        }

        // ============================================
        // READ ALL TEMPERATURES
        // ============================================

        for (
            let i = 0n;
            i < count;
            i++
        ) {

            console.log(
                `\nIndex: ${i.toString()}`
            );

            const reading =
                await coldChainContract
                    .getTemperatureReading(i);

            console.log(
                "Shipment ID:",
                reading[0]
            );

            console.log(
                "Temperature:",
                reading[1].toString(),
                "°C"
            );

            console.log(
                "Timestamp:",
                reading[2].toString()
            );

            console.log(
                "Violation:",
                reading[3]
            );

            console.log(
                "Data Hash:",
                reading[4]
            );

            console.log(
                "--------------------------------"
            );
        }

    } catch (error) {

        console.error(
            "\n❌ Failed to read temperature:"
        );

        console.error(error);

    }
}

main();