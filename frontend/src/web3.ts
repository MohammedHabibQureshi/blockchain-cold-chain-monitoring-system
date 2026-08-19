import { ethers } from "ethers";
import { EXPECTED_CHAIN_ID, EXPECTED_CHAIN_NAME } from "./config";
import { messageOf } from "./utils";

export function hasMetaMask(): boolean {

    return typeof window !== "undefined" &&
        Boolean(window.ethereum);
}

export async function getChainId(): Promise<number | null> {

    if (!window.ethereum) return null;

    try {

        const chainId =
            await window.ethereum.request({
                method: "eth_chainId"
            });

        return Number(chainId);

    } catch {

        return null;
    }
}

export async function connectWallet(): Promise<string> {

    if (!window.ethereum) {

        throw new Error(
            "MetaMask was not detected"
        );
    }

    const accounts =
        (await window.ethereum.request({
            method: "eth_requestAccounts"
        })) as string[];

    return accounts[0];
}

export async function switchToColdChainNetwork(): Promise<void> {

    if (!window.ethereum) return;

    try {

        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x539" }]
        });

    } catch (error) {

        const code = messageOf(error);

        if (code.includes("4902")) {

            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x539",
                    chainName: EXPECTED_CHAIN_NAME,
                    rpcUrls: ["http://127.0.0.1:7545"]
                }]
            });
        } else {

            throw error;
        }
    }
}

let cachedProvider: ethers.BrowserProvider | null = null;
let cachedSigner: ethers.JsonRpcSigner | null = null;

export async function makeSignerContract(
    contractAddress: string,
    abi: ethers.InterfaceAbi
): Promise<ethers.Contract> {

    if (!window.ethereum) {

        throw new Error("MetaMask was not detected");
    }

    if (!cachedProvider) {
        cachedProvider =
            new ethers.BrowserProvider(window.ethereum);

        await cachedProvider.send(
            "eth_requestAccounts",
            []
        );
    }

    if (!cachedSigner) {
        cachedSigner =
            await cachedProvider.getSigner();
    }

    return new ethers.Contract(
        contractAddress,
        abi,
        cachedSigner
    );
}

export function resetSignerCache() {
    cachedProvider = null;
    cachedSigner = null;
}

export async function runTransaction(
    txPromise: Promise<ethers.TransactionResponse>
): Promise<{
    txHash: string;
    blockNumber: string;
}> {

    const tx = await txPromise;

    const receipt = await tx.wait();

    return {
        txHash: tx.hash,
        blockNumber:
            receipt?.blockNumber?.toString() ?? ""
    };
}

export async function correctNetwork(): Promise<boolean> {

    const chainId = await getChainId();

    return chainId === EXPECTED_CHAIN_ID;
}
export function txErrorMessage(error: unknown): string {

    const message = messageOf(error);

    if (message.includes("revert")) {

        const revertMatch = message.match(/revert (.*?)(?:\(|"|\.|$)/);

        if (revertMatch && revertMatch[1]) {

            return `Smart contract rejected: ${revertMatch[1].trim()}`;
        }

        return "Transaction rejected by the smart contract.";

    }

    if (message.includes("user rejected")) {

        return "Transaction cancelled in MetaMask.";

    }

    if (message.includes("insufficient funds")) {

        return "Insufficient funds for gas.";

    }

    return message;
}