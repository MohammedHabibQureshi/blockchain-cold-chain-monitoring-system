const hre = require("hardhat");

async function main() {

    const [admin, manufacturer, transporter, warehouse, distributor, hospital] =
        await hre.ethers.getSigners();

    console.log("Admin:", admin.address);
    console.log("Manufacturer:", manufacturer.address);
    console.log("Transporter:", transporter.address);
    console.log("Warehouse:", warehouse.address);
    console.log("Distributor:", distributor.address);
    console.log("Hospital:", hospital.address);

    const contractAddress =
        "YOUR_CONTRACT_ADDRESS";

    const ColdChain =
        await hre.ethers.getContractFactory("ColdChain");

    const contract =
        ColdChain.attach(contractAddress);

    await contract.registerUser(
        manufacturer.address,
        2
    );

    await contract.registerUser(
        transporter.address,
        3
    );

    await contract.registerUser(
        warehouse.address,
        4
    );

    await contract.registerUser(
        distributor.address,
        5
    );

    await contract.registerUser(
        hospital.address,
        6
    );

    console.log("Roles registered successfully.");
}

main().catch((error) => {

    console.error(error);

    process.exitCode = 1;
});