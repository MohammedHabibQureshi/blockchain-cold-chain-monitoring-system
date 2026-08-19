import { API_URL } from "./config";
import type {
    ContractConfig,
    CustodyEvent,
    Reading,
    Shipment,
    User,
    Violation
} from "./types";

async function request<T>(
    path: string,
    options?: RequestInit
): Promise<T> {

    const response = await fetch(
        `${API_URL}${path}`,
        options
    );

    const result = await response.json();

    if (!response.ok || result.success === false) {

        throw new Error(
            result.error ?? "Backend request failed"
        );
    }

    return result as T;
}

export function getConfig() {

    return request<{
        success: boolean;
        data: ContractConfig;
    }>("/config");
}

export function getUsers() {

    return request<{
        success: boolean;
        count: number;
        data: User[];
    }>("/users");
}

export function getUser(address: string) {

    return request<{
        success: boolean;
        data: User;
    }>(`/user/${address}`);
}

export function getShipments() {

    return request<{
        success: boolean;
        count: number;
        data: Shipment[];
    }>("/shipments");
}

export function getShipment(shipmentId: string) {

    return request<{
        success: boolean;
        data: Shipment;
    }>(`/shipment/${shipmentId}`);
}

export function getLatestReading(shipmentId: string) {

    return request<{
        success: boolean;
        data: Reading;
    }>(`/shipment/${shipmentId}/latest`);
}

export function getReadings(shipmentId: string) {

    return request<{
        success: boolean;
        count: number;
        data: Reading[];
    }>(`/shipment/${shipmentId}/readings`);
}

export function getViolations(shipmentId: string) {

    return request<{
        success: boolean;
        count: number;
        data: Violation[];
    }>(`/shipment/${shipmentId}/violations`);
}

export function getCustody(shipmentId: string) {

    return request<{
        success: boolean;
        count: number;
        data: CustodyEvent[];
    }>(`/shipment/${shipmentId}/custody`);
}

export function getAllViolations() {

    return request<{
        success: boolean;
        count: number;
        data: Violation[];
    }>("/violations");
}

export function getAllCustody() {

    return request<{
        success: boolean;
        count: number;
        data: CustodyEvent[];
    }>("/custody");
}

export function getShipmentsByCustodian(address: string) {

    return request<{
        success: boolean;
        count: number;
        data: Shipment[];
    }>(`/shipments/custodian/${address}`);
}

export function getShipmentsByAssigned(address: string) {

    return request<{
        success: boolean;
        count: number;
        data: Shipment[];
    }>(`/shipments/assigned/${address}`);
}

export function getShipmentsByManufacturer(address: string) {

    return request<{
        success: boolean;
        count: number;
        data: Shipment[];
    }>(`/shipments/manufacturer/${address}`);
}

export function recordTemperature(
    shipmentId: string,
    temperature: number,
    humidity?: number
) {

    return request<{
        success: boolean;
        data: any;
    }>("/temperature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId, temperature, humidity })
    });
}

export function getCancellationReason(shipmentId: string) {

    return request<{
        success: boolean;
        data: { shipmentId: string; reason: string };
    }>(`/shipment/${shipmentId}/cancellation-reason`);
}

export function getRoleCount(role: string) {

    return request<{
        success: boolean;
        data: { role: string; count: number };
    }>(`/role-count/${role}`);
}
