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
    const artifact = JSON.parse(fs.readFileSync(path.join('D:/projects/Blockchain-Cold-Chain-Monitoring/blockchain/artifacts/contracts/ColdChain.sol/ColdChain.json'), 'utf-8'));
    const contractAddr = '0x5d880CFB02306eb684e0D638fCcD9b59544253cC';

    const admin = new ethers.Wallet(adminKey, provider);
    const contract = new ethers.Contract(contractAddr, artifact.abi, admin);
    console.log('Admin:', admin.address);

    const users = [
        { addr: '0xFA57b736e0533741D8B576F59Ed787BACCAb4656', role: 2, name: 'MedSupply Corp' },
        { addr: '0x198d2C6056FBd854DB466EB1b3cCEf50405dAdf9', role: 3, name: 'ColdTransit Inc' },
        { addr: '0x9fB4279A0cE93327914498150c76361862643c87', role: 4, name: 'CryoVault Storage' },
        { addr: '0x52779856074C31787150E35608EaE627ebcb10A0', role: 5, name: 'PharmaDist LLC' },
        { addr: '0xD4E629ceA86b68F0E699521Fd54D3969CBeDC4dA', role: 6, name: 'City General Hospital' },
    ];

    for (const u of users) {
        try {
            const role = await contract.roles(u.addr);
            if (Number(role) === 0) {
                // Register
                const tx1 = await contract.registerUser(u.addr, u.role);
                await tx1.wait();
                console.log('Registered:', u.name, 'role', u.role);
            } else {
                console.log('Already registered:', u.name, 'role', role.toString());
            }
        } catch(e) {
            console.log('Register error for', u.name + ':', e.reason || e.shortMessage);
        }

        try {
            // Set name
            const tx2 = await contract.setParticipantName(u.addr, u.name);
            await tx2.wait();
            console.log('  Set name:', u.name);
        } catch(e) {
            console.log('  Name error:', e.reason || e.shortMessage || e.message?.substring(0, 100));
        }
    }

    // Verify
    console.log('\nAll registered users:');
    const count = Number(await contract.getUserCount());
    for (let i = 0; i < count; i++) {
        const result = await contract.getUserAt(i);
        const addr = result[0];
        const role = result[1];
        const name = await contract.participantNames(addr);
        console.log('  ' + addr + ' role=' + role + ' name=' + name);
    }

    console.log('\nDone!');
}
main().catch(e => { console.error(e); process.exit(1); });
