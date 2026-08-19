import { coldChainContract } from "./contract.js";

// ============================================
// VERIFY VIOLATIONS
// ============================================

async function main() {

    console.log("\n# VERIFY TEMPERATURE VIOLATIONS\n");

    console.log(
        "Contract:",
        coldChainContract.target
    );

    try {

        // ============================================
        // GET VIOLATION COUNT
        // ============================================

        const count =
            await coldChainContract
                .getViolationCount();

        console.log(
            "\nViolations stored:",
            count.toString()
        );

        // ============================================
        // NO VIOLATIONS
        // ============================================

        if (count === 0n) {

            console.log(
                "\n🟢 No temperature violations found."
            );

            return;
        }

        // ============================================
        // READ VIOLATIONS
        // ============================================

        for (
            let i = 0n;
            i < count;
            i++
        ) {

            const violation =
                await coldChainContract
                    .getViolation(i);

            console.log(
                "\n=============================="
            );

            console.log(
                "VIOLATION",
                i.toString()
            );

            console.log(
                "=============================="
            );

            console.log(
                "Shipment ID:",
                violation[0]
            );

            console.log(
                "Temperature:",
                violation[1].toString(),
                "°C"
            );

            console.log(
                "Timestamp:",
                violation[2].toString()
            );

            console.log(
                "Reason:",
                violation[3]
            );

            console.log(
                "Data Hash:",
                violation[4]
            );
        }

    } catch (error) {

        console.error(
            "\n❌ Failed to read violations:"
        );

        console.error(error);

    }
}

main();