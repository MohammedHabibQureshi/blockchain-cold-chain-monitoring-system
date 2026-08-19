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
import {
    Panel,
    StatCard,
    TxBanner,
    WalletInfo
} from "./ui";
import ShipmentList from "./ShipmentList";
import { ROLE_EMOJIS, ROLE_LABELS } from "../config";

interface Props {
    wallet: string;
    config: ContractConfig;
    role: number;
    title: string;
    nextRole: number;
    transferLabel: string;
}

export default function RoleDashboard({
    wallet,
    config,
    role,
    title,
    nextRole,
    transferLabel
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

        const interval = setInterval(load, 4000);

        return () => {

            clearTimeout(initial);

            clearInterval(interval);
        };
    }, [load]);

    const assignedShipments =
        shipments.filter(
            (shipment) =>
                shipment.currentCustodian.toLowerCase() ===
                wallet.toLowerCase()
        );

    const activeAssigned =
        assignedShipments.filter(
            (shipment) => shipment.status >= 2 && shipment.status <= 5
        );

    const transferTargets =
        users.filter((user) => user.role === nextRole);

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
                message: `Shipment ${shipmentId} transferred.`,
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
                <h1>{title}</h1>
                <WalletInfo
                    wallet={wallet}
                    roleLabel={ROLE_LABELS[role]}
                    roleEmoji={ROLE_EMOJIS[role]}
                />
            </div>

            <TxBanner tx={tx} onDismiss={dismissTx} />

            <div className="stats">
                <StatCard
                    emoji="📦"
                    label="Assigned Shipments"
                    value={assignedShipments.length}
                />
                <StatCard
                    emoji="🔄"
                    label="Active In My Custody"
                    value={activeAssigned.length}
                />
                <StatCard
                    emoji="🎯"
                    label="Transfer Targets"
                    value={transferTargets.length}
                />
            </div>

            <Panel title="📦 Assigned Shipments">
                <ShipmentList
                    shipments={assignedShipments}
                    wallet={wallet}
                    users={users}
                    transferUsers={transferTargets}
                    emptyMessage="No shipments are currently assigned to your wallet."
                    transferEnabled
                    transferLabel={transferLabel}
                    onTransfer={transferCustody}
                />
            </Panel>
        </div>
    );
}
