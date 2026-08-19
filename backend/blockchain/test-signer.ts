import {
    signer,
    writableColdChainContract
} from "./blockchain.js";


async function main() {

    console.log("🔐 Checking blockchain signer...");

    const address =
        await signer.getAddress();

    console.log(
        "Backend wallet:",
        address
    );


    const balance =
        await signer.provider!.getBalance(
            address
        );

    console.log(
        "Balance:",
        balance.toString()
    );


    const admin =
        await writableColdChainContract.admin();

    console.log(
        "Contract admin:",
        admin
    );


    console.log(
        "Is backend admin:",
        address.toLowerCase() ===
        admin.toLowerCase()
    );

}


main().catch((error) => {

    console.error(
        "❌ Signer test failed:"
    );

    console.error(error);

    process.exit(1);

});