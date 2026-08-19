const { ethers } = require('ethers');
require('dotenv').config();

const rpcUrl = process.env.GANACHE_RPC_URL;
const adminKey = process.env.ADMIN_PRIVATE_KEY || process.env.GANACHE_PRIVATE_KEY;

if (!rpcUrl || !adminKey) {
    throw new Error('GANACHE_RPC_URL and ADMIN_PRIVATE_KEY (or GANACHE_PRIVATE_KEY) are required');
}

async function main() {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(adminKey, provider);
    console.log('Signer:', signer.address);
    try {
        const tx = await signer.sendTransaction({
            to: '0xFA57b736e0533741D8B576F59Ed787BACCAb4656',
            value: ethers.parseEther('0.001')
        });
        console.log('Transfer OK:', tx.hash);
    } catch(e) {
        console.log('Transfer error:', e.reason || e.message?.substring(0,200));
    }
}
main();
