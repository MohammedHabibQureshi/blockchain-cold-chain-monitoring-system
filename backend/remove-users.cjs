const { ethers } = require('ethers');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const rpcUrl = process.env.GANACHE_RPC_URL;
const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.GANACHE_PRIVATE_KEY;

if (!rpcUrl || !adminKey) {
    throw new Error('GANACHE_RPC_URL and ADMIN_PRIVATE_KEY (or GANACHE_PRIVATE_KEY) are required');
}

async function main() {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(adminKey, provider);
    const artifact = JSON.parse(fs.readFileSync(path.join('D:/projects/Blockchain-Cold-Chain-Monitoring/blockchain/artifacts/contracts/ColdChain.sol/ColdChain.json'), 'utf-8'));
    const contract = new ethers.Contract('0x5d880CFB02306eb684e0D638fCcD9b59544253cC', artifact.abi, signer);

    console.log('Admin:', signer.address);

    // Check the function signature
    const fragment = contract.interface.getFunction('removeUser');
    console.log('Function:', fragment.format());

    const toRemove = [
        '0x36D41Fd7e36BBaAc67f18F12c7d8e3a0B0caF00c',
        '0x01A5C538f48b18f6dd8627860D911dd37816cF2b'
    ];

    for (const addr of toRemove) {
        try {
            const role = await contract.roles(addr);
            console.log('Role for', addr, ':', role.toString());
            if (role.toString() === '0') {
                console.log('  Already not registered');
                continue;
            }
            const tx = await contract.removeUser(addr);
            const receipt = await tx.wait();
            console.log('  Removed:', addr, 'block:', receipt.blockNumber);
        } catch(e) {
            console.log('  Error:', e.reason || e.message?.substring(0, 200));
            // Try to decode revert data
            if (e.data) console.log('  Data:', e.data);
        }
    }

    // Verify
    console.log('\nVerifying:');
    for (const addr of toRemove) {
        const role = await contract.roles(addr);
        console.log(' ', addr, 'role:', role.toString());
    }
}
main();
