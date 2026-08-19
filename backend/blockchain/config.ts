import "dotenv/config";


export const BLOCKCHAIN_RPC_URL =
    process.env.BLOCKCHAIN_RPC_URL ||
    "http://127.0.0.1:7545";


export const PRIVATE_KEY =
    process.env.PRIVATE_KEY;


export const COLDCHAIN_CONTRACT_ADDRESS =
    process.env.COLDCHAIN_CONTRACT_ADDRESS ||
    "0x75fe54969850f7201221ee18dfb2DB5ba502f061";