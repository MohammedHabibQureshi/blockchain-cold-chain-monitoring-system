import {
    recordTemperatureOnBlockchain
} from "./temperature.js";


async function main() {

    console.log(
        "🌡️ Testing blockchain temperature recording"
    );


    const result =
        await recordTemperatureOnBlockchain(
            "SHIP-001",
            5
        );


    console.log(
        "\n================================="
    );

    console.log(
        "✅ Temperature recorded"
    );

    console.log(
        "Transaction:",
        result.transactionHash
    );

    console.log(
        "Block:",
        result.blockNumber
    );

    console.log(
        "Data Hash:",
        result.dataHash
    );

    console.log(
        "================================="
    );

}


main().catch(
    (error) => {

        console.error(
            "\n❌ Test failed:"
        );

        console.error(
            error
        );

        process.exit(1);

    }
);