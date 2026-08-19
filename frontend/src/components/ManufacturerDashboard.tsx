import { useCallback, useEffect, useState } from "react";
import type {
    ContractConfig,
    Shipment,
    TxState,
    User
} from "../types";
import { getShipments, getUsers } from "../api";
import {
    makeSignerContract,
    runTransaction,
    txErrorMessage
} from "../web3";
import { short } from "../utils";
import {
    Empty,
    Panel,
    ShipmentCard,
    StatCard,
    TxBanner,
    WalletInfo
} from "./ui";
import { ROLE_EMOJIS, ROLE_LABELS } from "../config";
import ShipmentDetail from "./ShipmentDetail";

interface Props {
    wallet: string;
    config: ContractConfig;
}

export default function ManufacturerDashboard({
    wallet,
    config
}: Props) {

    const [users, setUsers] =
        useState<User[]>([]);

    const [shipments, setShipments] =
        useState<Shipment[]>([]);

    const [shipmentId, setShipmentId] =
        useState("");

    const [minTemperature, setMinTemperature] =
        useState("2");

    const [maxTemperature, setMaxTemperature] =
        useState("8");

    const [tx, setTx] =
        useState<TxState>({
            status: "idle",
            message: ""
        });

    const [selected, setSelected] =
        useState<string | null>(null);

    const [cancelModal, setCancelModal] =
        useState<string | null>(null);

    const [cancelReason, setCancelReason] =
        useState("");

    const dismissTx = useCallback(() => {
        setTx({ status: "idle", message: "" });
    }, []);

    const load = useCallback(async () => {

        try {

            const [usersRes, shipmentsRes] =
                await Promise.all([
                    getUsers(),
                    getShipments()
                ]);

            setUsers(usersRes.data);
            setShipments(shipmentsRes.data);

        } catch {
            // keep previous data
        }
    }, []);

    useEffect(() => {

        const initial = setTimeout(load, 0);

        const interval = setInterval(load, 10_000);

        return () => {

            clearTimeout(initial);

            clearInterval(interval);
        };
    }, [load]);

    const myShipments =
        shipments.filter(
            (shipment) =>
                shipment.manufacturer.toLowerCase() ===
                wallet.toLowerCase() &&
                shipment.currentCustodian.toLowerCase() ===
                wallet.toLowerCase() &&
                shipment.status === 0
        );

    const myShipmentHistory =
        shipments.filter(
            (shipment) =>
                shipment.manufacturer.toLowerCase() ===
                wallet.toLowerCase() &&
                (shipment.status === 6 || shipment.status === 7 || shipment.status > 5)
        );

    const transporters =
        users.filter((user) => user.role === 3);

    const createShipment = async () => {

        const id = shipmentId.trim();

        const min = Number(minTemperature);

        const max = Number(maxTemperature);

        if (!id || Number.isNaN(min) || Number.isNaN(max)) return;

        setTx({
            status: "pending",
            message: "Waiting for MetaMask confirmation…"
        });

        try {

            const contract =
                await makeSignerContract(
                    config.contractAddress,
                    JSON.parse(config.abi)
                );

            const { txHash, blockNumber } =
                await runTransaction(
                    contract.createShipment(id, min, max)
                );

            setTx({
                status: "success",
                message: `Shipment ${id} created on the blockchain.`,
                txHash,
                blockNumber
            });

            setShipmentId("");

            load();

        } catch (error) {

            setTx({
                status: "error",
                message: txErrorMessage(error)
            });
        }
    };

    const transferCustody = async (
        shipmentId: string,
        to: string
    ) => {

        setTx({
            status: "pending",
            message: "Waiting for MetaMask confirmation…"
        });

        try {

            const contract =
                await makeSignerContract(
                    config.contractAddress,
                    JSON.parse(config.abi)
                );

            const { txHash, blockNumber } =
                await runTransaction(
                    contract.transferCustody(shipmentId, to)
                );

            setTx({
                status: "success",
                message: `Shipment ${shipmentId} transferred to transporter.`,
                txHash,
                blockNumber
            });

            load();

        } catch (error) {

            setTx({
                status: "error",
                message: txErrorMessage(error)
            });
        }
    };

    const cancelShipment = async (shipmentId: string, _reason: string) => {

        setTx({
            status: "pending",
            message: "Waiting for MetaMask confirmation…"
        });

        try {

            const contract =
                await makeSignerContract(
                    config.contractAddress,
                    JSON.parse(config.abi)
                );

            const { txHash, blockNumber } =
                await runTransaction(
                    contract.cancelShipment(shipmentId)
                );

            setTx({
                status: "success",
                message: `Shipment ${shipmentId} has been cancelled.`,
                txHash,
                blockNumber
            });

            setCancelModal(null);
            setCancelReason("");

            load();

        } catch (error) {

            setTx({
                status: "error",
                message: txErrorMessage(error)
            });
        }
    };

    const requestReshipment = async (shipmentId: string) => {

        setTx({
            status: "pending",
            message: "Waiting for MetaMask confirmation…"
        });

        try {

            const contract =
                await makeSignerContract(
                    config.contractAddress,
                    JSON.parse(config.abi)
                );

            const { txHash, blockNumber } =
                await runTransaction(
                    contract.requestReshipment(shipmentId)
                );

            setTx({
                status: "success",
                message: `Reshipment requested for ${shipmentId}. Manufacturer will review.`,
                txHash,
                blockNumber
            });

            load();

        } catch (error) {

            setTx({
                status: "error",
                message: txErrorMessage(error)
            });
        }
    };

    const continueShipment = async (shipmentId: string) => {

        setTx({
            status: "pending",
            message: "Acknowledging violation and continuing shipment…"
        });

        try {

            setTx({
                status: "success",
                message: `Shipment ${shipmentId} violation acknowledged. Shipment continues.`,
                txHash: "",
                blockNumber: ""
            });

            load();

        } catch (error) {

            setTx({
                status: "error",
                message: txErrorMessage(error)
            });
        }
    };

    const activeInMyHands =
        myShipments.filter(
            (shipment) =>
                shipment.currentCustodian.toLowerCase() ===
                wallet.toLowerCase()
        ).length;

    return (
        <div>
            <div className="dashboard-head">
                <h1>🏭 Manufacturer Dashboard</h1>
                <WalletInfo
                    wallet={wallet}
                    roleLabel={ROLE_LABELS[2]}
                    roleEmoji={ROLE_EMOJIS[2]}
                />
            </div>

            <TxBanner tx={tx} onDismiss={dismissTx} />

            <div className="stats">
                <StatCard
                    emoji="📦"
                    label="My Shipments"
                    value={myShipments.length}
                />
                <StatCard
                    emoji="👑"
                    label="In My Custody"
                    value={activeInMyHands}
                />
                <StatCard
                    emoji="🚚"
                    label="Registered Transporters"
                    value={transporters.length}
                />
            </div>

            <Panel title="➕ Create New Shipment">
                <div className="form-grid">
                    <input
                        type="text"
                        placeholder="Shipment ID (e.g. SHIP-002)"
                        value={shipmentId}
                        onChange={(event) => setShipmentId(event.target.value)}
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Min °C"
                        value={minTemperature}
                        onChange={(event) => setMinTemperature(event.target.value)}
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Max °C"
                        value={maxTemperature}
                        onChange={(event) => setMaxTemperature(event.target.value)}
                    />
                    <button
                        className="btn-primary"
                        disabled={!shipmentId.trim() || tx.status === "pending"}
                        onClick={createShipment}
                    >
                        {tx.status === "pending"
                            ? "⏳ Creating…"
                            : "📦 Create Shipment"}
                    </button>
                </div>
            </Panel>

            <Panel title="📦 My Active Shipments">
                <div className="panel-scroll">
                    {myShipments.length === 0 ? (
                        <Empty message="No active shipments in your custody." />
                    ) : (
                        <div className="admin-items-grid">
                            {myShipments.map((shipment) => (
                                <ShipmentCard
                                    key={shipment.shipmentId}
                                    shipment={shipment}
                                    onClick={() => setSelected(shipment.shipmentId)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Panel>

            {myShipmentHistory.length > 0 && (
                <Panel title="📜 Shipment History">
                    <div className="panel-scroll">
                        <div className="admin-items-grid">
                            {myShipmentHistory.map((shipment) => (
                                <ShipmentCard
                                    key={shipment.shipmentId}
                                    shipment={shipment}
                                    onClick={() => setSelected(shipment.shipmentId)}
                                />
                            ))}
                        </div>
                    </div>
                </Panel>
            )}

            {cancelModal && (
                <div className="cancel-modal-overlay" onClick={() => setCancelModal(null)}>
                    <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>🚫 Cancel Shipment</h3>
                        <p>
                            <strong>Shipment:</strong> {cancelModal}
                        </p>
                        <p>
                            Please provide a reason for cancelling this shipment:
                        </p>
                        <textarea
                            placeholder="Enter cancellation reason…"
                            value={cancelReason}
                            onChange={(event) => setCancelReason(event.target.value)}
                            rows={3}
                        />
                        <div className="cancel-modal-buttons">
                            <button
                                className="btn-danger"
                                disabled={!cancelReason.trim() || tx.status === "pending"}
                                onClick={() => cancelShipment(cancelModal, cancelReason)}
                            >
                                {tx.status === "pending" ? "⏳ Cancelling…" : "🚫 Confirm Cancellation"}
                            </button>
                            <button
                                className="btn-ghost"
                                onClick={() => { setCancelModal(null); setCancelReason(""); }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selected && (
                <div className="detail-wrapper">
                    <div className="detail-head">
                        <h3>Details: {selected}</h3>
                        <button
                            className="btn-ghost"
                            onClick={() => setSelected(null)}
                        >
                            ✖ Close
                        </button>
                    </div>
                    <ShipmentDetail
                        shipmentId={selected}
                        wallet={wallet}
                        users={users}
                        transferUsers={transporters}
                        canTransfer={
                            myShipments.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.status >= 0 &&
                                    s.status <= 5 &&
                                    s.currentCustodian.toLowerCase() === wallet.toLowerCase()
                            )
                        }
                        transferLabel="🚚 Transfer to Transporter"
                        onTransfer={async (to) => {
                            await transferCustody(selected, to);
                            setSelected(null);
                        }}
                        showCancel={
                            myShipments.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.status >= 0 &&
                                    s.status <= 5
                            )
                        }
                        onCancel={async () => {
                            setCancelModal(selected);
                        }}
                        showReshipment={
                            myShipments.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.status === 8
                            )
                        }
                        onReshipment={async () => {
                            await requestReshipment(selected);
                            setSelected(null);
                        }}
                        showContinue={
                            myShipments.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.status >= 2 &&
                                    s.status <= 5
                            )
                        }
                        continueLabel="🚛 Continue Shipment"
                        onContinue={async () => {
                            await continueShipment(selected);
                            setSelected(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
