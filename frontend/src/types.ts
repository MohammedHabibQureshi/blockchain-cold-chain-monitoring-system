export interface Shipment {
    shipmentId: string;
    manufacturer: string;
    currentCustodian: string;
    assignedCustodian: string;
    minTemperature: number;
    maxTemperature: number;
    createdAt: string;
    status: number;
    statusName: string;
    active: boolean;
}

export interface Reading {
    shipmentId: string;
    temperature: number;
    humidity: number;
    timestamp: string;
    violation: boolean;
    dataHash: string;
}

export interface Violation {
    shipmentId: string;
    temperature: number;
    timestamp: string;
    reason: string;
    dataHash: string;
}

export interface CustodyEvent {
    shipmentId: string;
    from: string;
    to: string;
    timestamp: string;
    blockNumber: string;
}

export interface User {
    address: string;
    role: number;
    roleName: string;
    name: string;
}

export interface ContractConfig {
    contractAddress: string;
    rpcUrl: string;
    expectedChainId: number;
    abi: string;
}

export type TxStatus =
    | "idle"
    | "pending"
    | "success"
    | "error";

export interface TxState {
    status: TxStatus;
    message: string;
    txHash?: string;
    blockNumber?: string;
}
