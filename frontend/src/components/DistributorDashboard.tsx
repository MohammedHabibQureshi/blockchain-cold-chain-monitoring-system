import { useCallback, useEffect, useState } from "react";
import type {
    ContractConfig,
    Shipment,
    TxState,
    User
} from "../types";
import { getShipments, getUsers, getRoleCount } from "../api";
import {
    makeSignerContract,
    runTransaction,
    txErrorMessage
} from "../web3";
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

export default function DistributorDashboard({
    wallet,
    config
}: Props) {

    const [users, setUsers] =
        useState<User[]>([]);

    const [shipments, setShipments] =
        useState<Shipment[]>([]);

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

    const [distributorCount, setDistributorCount] =
        useState(0);

    const dismissTx = useCallback(() => {
        setTx({ status: "idle", message: "" });
    }, []);

    const load = useCallback(async () => {

        try {

            const [usersRes, shipmentsRes, countRes] =
                await Promise.all([
                    getUsers(),
                    getShipments(),
                    getRoleCount("DISTRIBUTOR")
                ]);

            setUsers(usersRes.data);
            setShipments(shipmentsRes.data);
            setDistributorCount(countRes.data.count);

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

    const incomingShipments =
        shipments.filter(
            (shipment) =>
                shipment.assignedCustodian.toLowerCase() ===
                wallet.toLowerCase() &&
                shipment.status === 1
        );

    const inCustody =
        shipments.filter(
            (shipment) =>
                shipment.currentCustodian.toLowerCase() ===
                wallet.toLowerCase() &&
                shipment.status === 4
        );

    const hospitals =
        users.filter((user) => user.role === 6);

    const acceptCustody = async (shipmentId: string) => {

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
                    contract.acceptCustody(shipmentId)
                );

            setTx({
                status: "success",
                message: `Shipment ${shipmentId} accepted. You are now the custodian.`,
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
                message: `Shipment ${shipmentId} transferred to hospital.`,
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

    return (
        <div>
            <div className="dashboard-head">
                <h1>📦 Distributor Dashboard</h1>
                <WalletInfo
                    wallet={wallet}
                    roleLabel={ROLE_LABELS[5]}
                    roleEmoji={ROLE_EMOJIS[5]}
                />
            </div>

            <TxBanner tx={tx} onDismiss={dismissTx} />

            <div className="stats">
                <StatCard
                    emoji="📥"
                    label="Incoming Shipments"
                    value={incomingShipments.length}
                />
                <StatCard
                    emoji="📦"
                    label="In My Custody"
                    value={inCustody.length}
                />
                <StatCard
                    emoji="📦"
                    label="Distributors"
                    value={distributorCount}
                />
            </div>

            <Panel title="📥 Incoming Shipments (Awaiting Acceptance)">
                <div className="panel-scroll">
                    {incomingShipments.length === 0 ? (
                        <Empty message="No incoming shipments awaiting your acceptance." />
                    ) : (
                        <div className="admin-items-grid">
                            {incomingShipments.map((shipment) => (
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

            <Panel title="📦 Shipments In My Custody">
                <div className="panel-scroll">
                    {inCustody.length === 0 ? (
                        <Empty message="No shipments currently in your custody." />
                    ) : (
                        <div className="admin-items-grid">
                            {inCustody.map((shipment) => (
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
                        showAccept={
                            incomingShipments.some(
                                (s) => s.shipmentId === selected
                            )
                        }
                        acceptLabel="✅ Accept Custody"
                        onAccept={async () => {
                            await acceptCustody(selected);
                            setSelected(null);
                        }}
                        transferUsers={hospitals}
                        canTransfer={
                            inCustody.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.currentCustodian.toLowerCase() === wallet.toLowerCase()
                            )
                        }
                        transferLabel="🏥 Transfer to Hospital"
                        onTransfer={async (to) => {
                            await transferCustody(selected, to);
                            setSelected(null);
                        }}
                        showCancel={
                            inCustody.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.status === 4
                            )
                        }
                        onCancel={async () => {
                            setCancelModal(selected);
                        }}
                        showReshipment={
                            inCustody.some(
                                (s) =>
                                    s.shipmentId === selected &&
                                    s.status === 8
                            )
                        }
                        onReshipment={async () => {
                            await requestReshipment(selected);
                            setSelected(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
