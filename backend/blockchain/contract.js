const { ethers } = require("ethers");

const RPC_URL = process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545";
const CONTRACT_ADDRESS = "0x79d0634184E99049702A247CA4ba201800b763f8";

const provider = new ethers.JsonRpcProvider(RPC_URL);
let coldChainContract;

try {
  const accounts = provider.listAccounts ? provider.listAccounts() : [];
  // Use a simple approach - just create the contract instance
  // We'll use the full ABI approach below
} catch (e) {
  console.log("Using fallback approach");
}

const fs = require("fs");
const abi = JSON.parse(fs.readFileSync(
  "./blockchain/artifacts/contracts/ColdChain.sol/ColdChain.json",
  "utf8"
).abi);

coldChainContract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

module.exports = {
  coldChainContract
};