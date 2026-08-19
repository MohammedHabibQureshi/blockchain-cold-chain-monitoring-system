import { useCallback, useEffect, useState } from "react";
import type {
    ContractConfig,
    Shipment,
    TxState,
    User,
    Violation,
    CustodyEvent
} from "../types";
import {
    getAllViolations,
    getShipments,
    getUsers,
    getCancellationReason,
    getCustody
} from "../api";
import {
    makeSignerContract,
    runTransaction,
    txErrorMessage
} from "../web3";
import { formatTimestamp, short } from "../utils";
import {
    Empty,
    Panel,
    StatCard,
    TxBanner,
    WalletInfo
} from "./ui";
import { REGISTRABLE_ROLES, ROLE_EMOJIS, ROLE_LABELS, SHIPMENT_STATUS } from "../config";
import ShipmentDetail from "./ShipmentDetail";

interface Props {
    wallet: string;
    config: ContractConfig;
}

export default function AdminDashboard({
    wallet,
    config
}: Props) {

    const [users, setUsers] =
        useState<User[]>([]);

    const [shipments, setShipments] =
        useState<Shipment[]>([]);

    const [violations, setViolations] =
        useState<Violation[]>([]);

    const [contractAdmin, setContractAdmin] =
        useState<string>("");

    const [address, setAddress] =
        useState("");

    const [participantName, setParticipantName] =
        useState("");

    const [role, setRole] =
        useState(2);

    const [tx, setTx] =
        useState<TxState>({
            status: "idle",
            message: ""
        });

    const [showAdminStatus, setShowAdminStatus] =
        useState(true);

    const [selected, setSelected] =
        useState<string | null>(null);

    const [selectedUser, setSelectedUser] =
        useState<string | null>(null);

    const [confirmRemove, setConfirmRemove] =
        useState<string | null>(null);

    const dismissTx = useCallback(() => {
        setTx({ status: "idle", message: "" });
    }, []);

    const load = useCallback(async () => {

        try {

            const [usersRes, shipmentsRes, violationsRes] =
                await Promise.all([
                    getUsers(),
                    getShipments(),
                    getAllViolations()
                ]);

            setUsers(usersRes.data);
            setShipments(shipmentsRes.data);
            setViolations(violationsRes.data);

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

    useEffect(() => {

        let mounted = true;

        const fetchAdmin = async () => {

            try {

                const contract =
                    await makeSignerContract(
                        config.contractAddress,
                        JSON.parse(config.abi)
                    );

                const admin = await contract.admin();

                if (mounted) {

                    setContractAdmin(admin);
                }

            } catch {

                // ignore
            }
        };

        fetchAdmin();

        return () => {
            mounted = false;
        };
    }, [config]);

    useEffect(() => {

        if (!contractAdmin) return;

        setShowAdminStatus(true);

        const timer = setTimeout(
            () => setShowAdminStatus(false),
            5000
        );

        return () => clearTimeout(timer);
    }, [contractAdmin]);

    const isAdminWallet =
        contractAdmin &&
        wallet.toLowerCase() === contractAdmin.toLowerCase();

    const registerUser = async () => {

        if (!address.trim()) return;

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

            const signerAddress =
                await contract.runner.getAddress();

            if (
                contractAdmin &&
                signerAddress.toLowerCase() !== contractAdmin.toLowerCase()
            ) {

                setTx({
                    status: "error",
                    message: `Your wallet ${short(signerAddress)} is not the contract admin. The contract admin is ${short(contractAdmin)}. Please switch MetaMask to account ${contractAdmin}.`
                });

                return;
            }

            const { txHash, blockNumber } =
                await runTransaction(
                    contract.registerUser(address.trim(), role)
                );

            if (participantName.trim()) {
                try {
                    await runTransaction(
                        contract.setParticipantName(address.trim(), participantName.trim())
                    );
                } catch {
                    // name set failed but user was registered
                }
            }

            setTx({
                status: "success",
                message: `User registered as ${ROLE_LABELS[role]}.`,
                txHash,
                blockNumber
            });

            setAddress("");
            setParticipantName("");

            load();

        } catch (error) {

            const errorMsg = txErrorMessage(error);

            let friendlyMessage = errorMsg;

            if (errorMsg.includes("Only admin")) {

                friendlyMessage =
                    `Only the contract admin can register users. Your wallet (${short(wallet)}) is not the admin. ` +
                    `The contract admin is ${contractAdmin ? short(contractAdmin) : "unknown"}. ` +
                    `Please switch MetaMask to the admin wallet.`;

            } else if (errorMsg.includes("already exists")) {

                friendlyMessage =
                    `This wallet address is already registered in the system.`;

            } else if (errorMsg.includes("Cannot assign admin")) {

                friendlyMessage =
                    `Cannot assign the Admin role to a new user. Only the original deployer is the admin.`;

            }

            setTx({
                status: "error",
                message: friendlyMessage
            });
        }
    };

    const removeUser = async (userAddress: string) => {

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
                    contract.removeUser(userAddress)
                );

            setTx({
                status: "success",
                message: `User ${short(userAddress)} has been removed.`,
                txHash,
                blockNumber
            });

            setConfirmRemove(null);

            load();

        } catch (error) {

            const errorMsg = txErrorMessage(error);

            let friendlyMessage = errorMsg;

            if (errorMsg.includes("Cannot remove admin")) {

                friendlyMessage = "Cannot remove the admin account.";

            } else if (errorMsg.includes("not registered")) {

                friendlyMessage = "This user is not registered.";

            }

            setTx({
                status: "error",
                message: friendlyMessage
            });
        }
    };

    const cancelShipment = async (shipmentId: string) => {

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

            load();

        } catch (error) {

            setTx({
                status: "error",
                message: txErrorMessage(error)
            });
        }
    };

    const cancelledShipments =
        shipments.filter((s) => s.status === 7);

    const completedShipments =
        shipments.filter((s) => s.status === 6);

    return (
        <div>
            <div className="dashboard-head">
                <h1>👑 Admin Dashboard</h1>
                <WalletInfo
                    wallet={wallet}
                    roleLabel={ROLE_LABELS[1]}
                    roleEmoji={ROLE_EMOJIS[1]}
                />
            </div>

            {showAdminStatus && contractAdmin && !isAdminWallet && (
                <div className="tx-banner tx-error" style={{ marginBottom: "20px" }}>
                    <p>
                        ⚠️ <strong>Wallet Mismatch</strong>
                    </p>
                    <p>
                        Your connected wallet: <code className="inline">{short(wallet)}</code>
                    </p>
                    <p>
                        Contract admin wallet: <code className="inline">{short(contractAdmin)}</code>
                    </p>
                    <p>
                        Please switch MetaMask to account <code className="inline">{contractAdmin}</code> to register users.
                    </p>
                    <p style={{ fontSize: "12px", opacity: 0.7 }}>
                        Full admin address: {contractAdmin}
                    </p>
                </div>
            )}

            {showAdminStatus && contractAdmin && isAdminWallet && (
                <div className="tx-banner tx-success" style={{ marginBottom: "20px" }}>
                    <p>
                        ✅ <strong>Connected as Contract Admin</strong>
                    </p>
                    <p>
                        Wallet <code className="inline">{short(wallet)}</code> matches the contract admin. You can register users.
                    </p>
                </div>
            )}

            <TxBanner tx={tx} onDismiss={dismissTx} />

            <div className="stats">
                <StatCard
                    emoji="👤"
                    label="Users"
                    value={users.length}
                />
                <StatCard
                    emoji="📦"
                    label="Shipments"
                    value={shipments.length}
                />
                <StatCard
                    emoji="🚨"
                    label="Violations"
                    value={violations.length}
                />
            </div>

            <Panel title="👤 Register New Participant">
                <div className="form-grid-4">
                    <input
                        type="text"
                        placeholder="Participant Name (e.g. Vijayawada Hospital)"
                        value={participantName}
                        onChange={(event) => setParticipantName(event.target.value)}
                    />
                    <select
                        value={role}
                        onChange={(event) => setRole(Number(event.target.value))}
                    >
                        {REGISTRABLE_ROLES.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Wallet Address 0x…"
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                    />
                    <button
                        className="btn-primary"
                        disabled={!address.trim() || tx.status === "pending"}
                        onClick={registerUser}
                    >
                        {tx.status === "pending"
                            ? "⏳ Registering…"
                            : "✅ Register User"}
                    </button>
                </div>
            </Panel>

            <Panel title="📋 Registered Users">
                <div className="panel-scroll">
                    {users.length === 0 ? (
                        <Empty message="No users registered." />
                    ) : (
                        <div className="admin-items-grid">
                            {users.filter(u => u.role !== 0).map((user, index) => (
                                <div className="admin-item-card" key={index}>
                                    <div className="admin-item-title">
                                        {ROLE_EMOJIS[user.role]} {user.name || ROLE_LABELS[user.role]}
                                    </div>
                                    <code className="hash">
                                        {user.address}
                                    </code>
                                    <span className="badge badge-safe">
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                    {user.role !== 1 && (
                                        <>
                                            {confirmRemove === user.address ? (
                                                <div className="confirm-remove">
                                                    <p className="danger-text">Remove this user?</p>
                                                    <div className="confirm-buttons">
                                                        <button
                                                            className="btn-danger"
                                                            style={{ fontSize: "12px", padding: "6px 12px" }}
                                                            onClick={() => removeUser(user.address)}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            className="btn-ghost"
                                                            style={{ fontSize: "12px", padding: "6px 12px" }}
                                                            onClick={() => setConfirmRemove(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn-danger"
                                                    style={{ fontSize: "12px", padding: "6px 12px", marginTop: "4px" }}
                                                    onClick={() => setConfirmRemove(user.address)}
                                                >
                                                    🗑️ Remove
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panel>

            <Panel title="📦 All Shipments">
                <div className="panel-scroll">
                    {shipments.length === 0 ? (
                        <Empty message="No shipments created yet." />
                    ) : (
                        <div className="admin-items-grid">
                            {shipments.map((shipment, index) => {
                                const statusInfo = SHIPMENT_STATUS[shipment.status] || {
                                    label: shipment.active ? "ACTIVE" : "COMPLETED",
                                    color: shipment.active ? "badge-safe" : "badge-completed",
                                    emoji: "📦"
                                };
                                return (
                                    <div
                                        className="admin-item-card clickable"
                                        key={index}
                                        onClick={() => setSelected(shipment.shipmentId)}
                                    >
                                        <div className="admin-item-title">
                                            {shipment.shipmentId}
                                        </div>
                                        <p>
                                            <strong>Maker:</strong>{" "}
                                            <code className="inline">
                                                {short(shipment.manufacturer)}
                                            </code>
                                        </p>
                                        <p>
                                            <strong>Custodian:</strong>{" "}
                                            <code className="inline">
                                                {short(shipment.currentCustodian)}
                                            </code>
                                        </p>
                                        <p>
                                            <strong>Range:</strong>{" "}
                                            {shipment.minTemperature}°C –{" "}
                                            {shipment.maxTemperature}°C
                                        </p>
                                        <span className={`badge ${statusInfo.color}`}>
                                            {statusInfo.emoji} {statusInfo.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Panel>

            {cancelledShipments.length > 0 && (
                <Panel title={`🚫 Cancelled Shipments (${cancelledShipments.length})`}>
                    <div className="panel-scroll">
                        <div className="admin-items-grid">
                            {cancelledShipments.map((shipment, index) => (
                                <CancelledShipmentCard
                                    key={index}
                                    shipment={shipment}
                                    onClick={() => setSelected(shipment.shipmentId)}
                                />
                            ))}
                        </div>
                    </div>
                </Panel>
            )}

            {completedShipments.length > 0 && (
                <Panel title={`✅ Completed Shipments (${completedShipments.length})`}>
                    <div className="panel-scroll">
                        <div className="admin-items-grid">
                            {completedShipments.map((shipment, index) => (
                                <div
                                    className="admin-item-card clickable"
                                    key={index}
                                    onClick={() => setSelected(shipment.shipmentId)}
                                >
                                    <div className="admin-item-title">
                                        {shipment.shipmentId}
                                    </div>
                                    <p>
                                        <strong>Manufacturer:</strong>{" "}
                                        <code className="inline">
                                            {short(shipment.manufacturer)}
                                        </code>
                                    </p>
                                    <p>
                                        <strong>Final Custodian:</strong>{" "}
                                        <code className="inline">
                                            {short(shipment.currentCustodian)}
                                        </code>
                                    </p>
                                    <span className="badge badge-completed">
                                        ✅ COMPLETED
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>
            )}

            <Panel title="🚨 Violations">
                <div className="panel-scroll">
                    {violations.length === 0 ? (
                        <Empty message="No violations recorded." />
                    ) : (
                        <div className="admin-items-grid">
                            {[...violations].reverse().map((violation, index) => (
                                <div className="admin-item-card violation-card" key={index}>
                                    <div className="violation-title">
                                        🚨 Violation #{index + 1}
                                    </div>
                                    <p>
                                        <strong>Temperature:</strong>{" "}
                                        {violation.temperature}°C
                                    </p>
                                    <p>
                                        <strong>Shipment:</strong>{" "}
                                        {violation.shipmentId}
                                    </p>
                                    <p>
                                        <strong>Reason:</strong>{" "}
                                        {violation.reason}
                                    </p>
                                    <p>
                                        <strong>Timestamp:</strong>{" "}
                                        {formatTimestamp(violation.timestamp)}
                                    </p>
                                    <p>
                                        <strong>Data Hash:</strong>
                                    </p>
                                    <code className="hash">
                                        {violation.dataHash}
                                    </code>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Panel>

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
                    <AdminShipmentDetail
                        shipmentId={selected}
                        wallet={wallet}
                        users={users}
                        onCancel={cancelShipment}
                    />
                </div>
            )}
        </div>
    );
}

function CancelledShipmentCard({
    shipment,
    onClick
}: {
    shipment: Shipment;
    onClick: () => void;
}) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        getCancellationReason(shipment.shipmentId)
            .then((res) => setReason(res.data.reason))
            .catch(() => {});
    }, [shipment.shipmentId]);

    return (
        <div className="admin-item-card clickable" onClick={onClick}>
            <div className="admin-item-title">
                {shipment.shipmentId}
            </div>
            <p>
                <strong>Manufacturer:</strong>{" "}
                <code className="inline">
                    {short(shipment.manufacturer)}
                </code>
            </p>
            <p>
                <strong>Custodian:</strong>{" "}
                <code className="inline">
                    {short(shipment.currentCustodian)}
                </code>
            </p>
            {reason && (
                <p>
                    <strong>Reason:</strong>{" "}
                    {reason}
                </p>
            )}
            <span className="badge badge-danger">
                🚫 CANCELLED
            </span>
        </div>
    );
}

function AdminShipmentDetail({
    shipmentId,
    wallet,
    users,
    onCancel
}: {
    shipmentId: string;
    wallet: string;
    users: User[];
    onCancel: (shipmentId: string) => Promise<void>;
}) {
    return (
        <ShipmentDetail
            shipmentId={shipmentId}
            wallet={wallet}
            users={users}
            canTransfer={false}
            showCancel={true}
            onCancel={() => onCancel(shipmentId)}
            showClose={false}
            showReshipment={false}
        />
    );
}
