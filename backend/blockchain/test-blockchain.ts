import {
    provider,
    coldChainContract
} from "./blockchain.js";


async function main() {

    console.log("🔗 Connecting to Ganache...");

    const network =
        await provider.getNetwork();

    console.log(
        "Chain ID:",
        network.chainId.toString()
    );

    console.log(
        "Contract:",
        await coldChainContract.getAddress()
    );

    const admin =
        await coldChainContract.admin();

    console.log(
        "Admin:",
        admin
    );

}


main().catch((error) => {

    console.error(
        "❌ Blockchain connection failed:"
    );

    console.error(error);

    process.exit(1);

});