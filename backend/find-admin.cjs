const { ethers } = require('ethers');
require('dotenv').config();
const target = '0x6733120a9d49406086771c51dcb31483ff9b91cd';
const mnemonic = process.env.GANACHE_MNEMONIC;

if (!mnemonic) {
    throw new Error('GANACHE_MNEMONIC is not configured in backend/.env');
}

// Ganache UI uses BIP44 m/44'/60'/0'/0/0
const hdNode = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(mnemonic));

for (let i = 0; i < 30; i++) {
    const w = hdNode.deriveChild(i);
    if (w.address.toLowerCase() === target) {
        console.log('FOUND at index', i, w.privateKey);
        process.exit(0);
    }
}

// Try without HD path
const wallet = ethers.Wallet.fromPhrase(mnemonic);
console.log('From phrase:', wallet.address, wallet.privateKey);

console.log('Not found');
