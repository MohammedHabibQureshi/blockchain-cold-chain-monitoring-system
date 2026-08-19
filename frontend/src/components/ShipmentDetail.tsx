import { useCallback, useEffect, useState } from "react";
import type {
    CustodyEvent,
    Reading,
    Shipment,
    User,
    Violation
} from "../types";
import { SHIPMENT_STATUS, ROLE_EMOJIS, ROLE_LABELS } from "../config";
import {
    getCustody,
    getLatestReading,
    getReadings,
    getShipment,
    getViolations,
    getCancellationReason
} from "../api";
import { formatTimestamp, messageOf, short } from "../utils";
import {
    Empty,
    Loading,
    Panel,
    TempBadge
} from "./ui";

interface Props {
    shipmentId: string;
    wallet: string;
    users: User[];
    transferUsers?: User[];
    canTransfer: boolean;
    transferLabel?: string;
    onTransfer?: (toAddress: string) => Promise<void>;
    onClose?: () => Promise<void>;
    closeLabel?: string;
    showClose?: boolean;
    showAccept?: boolean;
    acceptLabel?: string;
    onAccept?: () => Promise<void>;
    showCancel?: boolean;
    cancelLabel?: string;
    onCancel?: () => Promise<void>;
    showReshipment?: boolean;
    reshipmentLabel?: string;
    onReshipment?: () => Promise<void>;
    showContinue?: boolean;
    continueLabel?: string;
    onContinue?: () => Promise<void>;
}

export default function ShipmentDetail({
    shipmentId,
    wallet,
    users,
    transferUsers,
    canTransfer,
    transferLabel,
    onTransfer,
    onClose,
    closeLabel,
    showClose,
    showAccept,
    acceptLabel,
    onAccept,
    showCancel,
    cancelLabel,
    onCancel,
    showReshipment,
    reshipmentLabel,
    onReshipment,
    showContinue,
    continueLabel,
    onContinue
}: Props) {

    const [shipment, setShipment] =
        useState<Shipment | null>(null);

    const [latest, setLatest] =
        useState<Reading | null>(null);

    const [readings, setReadings] =
        useState<Reading[]>([]);

    const [violations, setViolations] =
        useState<Violation[]>([]);

    const [custody, setCustody] =
        useState<CustodyEvent[]>([]);

    const [target, setTarget] =
        useState("");

    const [busy, setBusy] =
        useState(false);

    const [error, setError] =
        useState("");

    const [cancellationReason, setCancellationReason] =
        useState("");

    const load = useCallback(async () => {

        try {

            const [shipmentRes, latestRes, custodyRes] =
                await Promise.allSettled([
                    getShipment(shipmentId),
                    getLatestReading(shipmentId),
                    getCustody(shipmentId)
                ]);

            if (shipmentRes.status === "fulfilled") {
                setShipment(shipmentRes.value.data);

                if (shipmentRes.value.data.status === 7) {
                    try {
                        const reasonRes = await getCancellationReason(shipmentId);
                        setCancellationReason(reasonRes.data.reason);
                    } catch {
                        setCancellationReason("");
                    }
                }
            }

            setLatest(
                latestRes.status === "fulfilled"
                    ? latestRes.value.data
                    : null
            );

            setCustody(
                custodyRes.status === "fulfilled"
                    ? custodyRes.value.data
                    : []
            );

        } catch {
            // keep previous data
        }

        getReadings(shipmentId)
            .then((res) => setReadings(res.data))
            .catch(() => {});

        getViolations(shipmentId)
            .then((res) => setViolations(res.data))
            .catch(() => {});
    }, [shipmentId]);

    useEffect(() => {

        setShipment(null);
        setLatest(null);
        setReadings([]);
        setViolations([]);
        setCustody([]);
        setCancellationReason("");

        let cancelled = false;

        const run = async () => {
            await load();
            if (cancelled) {
                setShipment(null);
                setLatest(null);
                setReadings([]);
                setViolations([]);
                setCustody([]);
                setCancellationReason("");
            }
        };

        const initial = setTimeout(run, 0);

        const interval = setInterval(run, 10_000);

        return () => {

            cancelled = true;

            clearTimeout(initial);

            clearInterval(interval);
        };
    }, [shipmentId, load]);

    const roleFor = (address: string) => {

        const user = users.find(
            (item) =>
                item.address.toLowerCase() === address.toLowerCase()
        );

        if (!user) return { emoji: "⛓️", label: "Registered" };

        return {
            emoji: ROLE_EMOJIS[user.role],
            label: ROLE_LABELS[user.role]
        };
    };

    const handleTransfer = async () => {

        if (!target || !onTransfer) return;

        setBusy(true);

        setError("");

        try {

            await onTransfer(target);

            setTarget("");

        } catch (transferError) {

            setError(messageOf(transferError));
        } finally {

            setBusy(false);
        }
    };

    const handleAccept = async () => {

        if (!onAccept) return;

        setBusy(true);

        setError("");

        try {

            await onAccept();

        } catch (acceptError) {

            setError(messageOf(acceptError));
        } finally {

            setBusy(false);
        }
    };

    const handleCancel = async () => {

        if (!onCancel) return;

        setBusy(true);

        setError("");

        try {

            await onCancel();

        } catch (cancelError) {

            setError(messageOf(cancelError));
        } finally {

            setBusy(false);
        }
    };

    const handleReshipment = async () => {

        if (!onReshipment) return;

        setBusy(true);

        setError("");

        try {

            await onReshipment();

        } catch (reshipError) {

            setError(messageOf(reshipError));
        } finally {

            setBusy(false);
        }
    };

    const handleContinue = async () => {

        if (!onContinue) return;

        setBusy(true);

        setError("");

        try {

            await onContinue();

        } catch (continueError) {

            setError(messageOf(continueError));
        } finally {

            setBusy(false);
        }
    };

    if (!shipment) return <Loading />;

    const statusInfo = SHIPMENT_STATUS[shipment.status] || {
        label: "UNKNOWN",
        color: "badge-muted",
        emoji: "❓"
    };

    const violationCount = violations.length;

    const isCompleted = shipment.status === 6;
    const isCancelled = shipment.status === 7;
    const isReshipmentRequested = shipment.status === 8;

    return (
        <div className="shipment-detail">
            <Panel title={`📦 Shipment ${shipment.shipmentId}`}>
                <div className="detail-grid">
                    <div>
                        <p>
                            <strong>Manufacturer:</strong>{" "}
                            {short(shipment.manufacturer)}
                        </p>
                        <p>
                            <strong>Current Custodian:</strong>{" "}
                            {short(shipment.currentCustodian)}
                        </p>
                        {shipment.assignedCustodian &&
                            shipment.assignedCustodian !== "0x0000000000000000000000000000000000000000" && (
                            <p>
                                <strong>Assigned Custodian:</strong>{" "}
                                {short(shipment.assignedCustodian)}
                            </p>
                        )}
                        <p>
                            <strong>Temperature Range:</strong>{" "}
                            {shipment.minTemperature}°C – {shipment.maxTemperature}°C
                        </p>
                    </div>
                    <div>
                        <p>
                            <strong>Created:</strong>{" "}
                            {formatTimestamp(shipment.createdAt)}
                        </p>
                        <p>
                            <strong>Status:</strong>{" "}
                            <span className={`badge ${statusInfo.color}`}>
                                {statusInfo.emoji} {statusInfo.label}
                            </span>
                        </p>
                        <p>
                            <strong>Violations:</strong>{" "}
                            {violationCount > 0
                                ? <span className="danger-text">🚨 {violationCount}</span>
                                : "🟢 None"}
                        </p>
                    </div>
                </div>

                {isCompleted && (
                    <div className="completed-banner">
                        <p>✅ <strong>Shipment Completed</strong></p>
                        <p>Final Custodian: Hospital</p>
                        <p>No further transfers are possible.</p>
                    </div>
                )}

                {isCancelled && (
                    <div className="cancelled-banner">
                        <p>🚫 <strong>Shipment Cancelled</strong></p>
                        <p>This shipment has been cancelled and cannot be transferred.</p>
                        {cancellationReason && (
                            <p>
                                <strong>Reason:</strong> {cancellationReason}
                            </p>
                        )}
                    </div>
                )}

                {isReshipmentRequested && (
                    <div className="reshipment-banner">
                        <p>🔄 <strong>Re-shipment Requested</strong></p>
                        <p>The manufacturer will review and re-initiate if approved.</p>
                    </div>
                )}
            </Panel>

            <Panel title="🌡️ Current Monitoring">
                {latest && latest.timestamp !== "0" && latest.timestamp !== 0 ? (
                    <div className="monitor-box">
                        <div className="monitor-temp">
                            {latest.temperature}°C
                        </div>
                        <div className="monitor-status">
                            <TempBadge
                                temperature={latest.temperature}
                                min={shipment.minTemperature}
                                max={shipment.maxTemperature}
                            />
                        </div>
                        <div className="monitor-details">
                            <p>
                                💧 Humidity: <strong>{latest.humidity}%</strong>
                            </p>
                            <p>
                                🕒 Last updated:{" "}
                                {formatTimestamp(latest.timestamp)}
                            </p>
                            <p>
                                🔐 Data hash:
                            </p>
                            <code className="hash">{latest.dataHash}</code>
                        </div>
                    </div>
                ) : (
                    <Empty message="No temperature readings recorded yet." />
                )}
            </Panel>

            <Panel title="🔄 Custody Timeline">
                <div className="timeline">
                    <div className="timeline-node">
                        <div className="timeline-emoji">
                            {roleFor(shipment.manufacturer).emoji}
                        </div>
                        <div className="timeline-title">
                            {roleFor(shipment.manufacturer).label}
                        </div>
                        <div className="timeline-address">
                            {short(shipment.manufacturer)}
                        </div>
                        <div className="timeline-meta">
                            Created • {formatTimestamp(shipment.createdAt)}
                        </div>
                    </div>

                    {custody.map((event, index) => {
                        const toRole = roleFor(event.to);
                        const isCurrent =
                            event.to.toLowerCase() === shipment.currentCustodian.toLowerCase();

                        return (
                            <div className="timeline-step" key={index}>
                                <div className="timeline-arrow">↓</div>
                                <div className={
                                    isCurrent
                                        ? "timeline-node current"
                                        : "timeline-node"
                                }>
                                    <div className="timeline-emoji">
                                        {toRole.emoji}
                                    </div>
                                    <div className="timeline-title">
                                        {toRole.label}
                                    </div>
                                    <div className="timeline-address">
                                        {short(event.to)}
                                    </div>
                                    <div className="timeline-meta">
                                        Received • {formatTimestamp(event.timestamp)}
                                        {event.blockNumber && (
                                            <span>
                                                {" "}
                                                • Block {event.blockNumber}
                                            </span>
                                        )}
                                        {isCurrent && (
                                            <span className="current-tag">
                                                {" "}
                                                CURRENT
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Panel>

            <Panel title="🌡️ Temperature History">
                {readings.length === 0 ? (
                    <Empty message="No temperature records found." />
                ) : (
                    <div className="panel-scroll">
                        <div className="history-table">
                            <div className="history-header">
                                <span>#</span>
                                <span>Temperature</span>
                                <span>Humidity</span>
                                <span>Status</span>
                                <span>Timestamp</span>
                            </div>
                            {[...readings].reverse().map((reading, index) => (
                                <div
                                    className="history-row"
                                    key={index}
                                >
                                    <span>{index + 1}</span>
                                    <span className="temperature-history-value">
                                        {reading.temperature}°C
                                    </span>
                                    <span>{reading.humidity}%</span>
                                    <span>
                                        {reading.violation ? (
                                            <strong className="danger-text">
                                                🚨 VIOLATION
                                            </strong>
                                        ) : (
                                            <strong className="safe-text">
                                                🟢 SAFE
                                            </strong>
                                        )}
                                    </span>
                                    <span>
                                        {formatTimestamp(reading.timestamp)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Panel>

            <Panel title="🚨 Violation History">
                <div className="panel-scroll">
                    {violations.length === 0 ? (
                        <Empty message="No violations recorded." />
                    ) : (
                        <div className="admin-items-grid">
                            {[...violations].reverse().map((violation, index) => (
                                <div
                                    className="admin-item-card violation-card"
                                    key={index}
                                >
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

            {showAccept && onAccept && (
                <Panel title="📥 Accept Shipment">
                    <p>
                        This shipment has been assigned to you. Review the details
                        and accept custody to proceed.
                    </p>
                    <button
                        className="btn-primary"
                        disabled={busy}
                        onClick={handleAccept}
                    >
                        {busy ? "⏳ Accepting…" : (acceptLabel ?? "✅ Accept Custody")}
                    </button>
                    {error && (
                        <p className="error-text">{error}</p>
                    )}
                </Panel>
            )}

            {canTransfer && onTransfer && (
                <Panel title={transferLabel ?? "↔️ Transfer Custody"}>
                    <div className="transfer-row">
                        <select
                            value={target}
                            onChange={(event) => setTarget(event.target.value)}
                        >
                            <option value="">
                                Select recipient…
                            </option>
                            {(transferUsers ?? users)
                                .filter(
                                    (user) =>
                                        user.address.toLowerCase() !==
                                        wallet.toLowerCase()
                                )
                                .map((user) => (
                                    <option
                                        key={user.address}
                                        value={user.address}
                                    >
                                        {ROLE_EMOJIS[user.role]} {ROLE_LABELS[user.role]} (
                                        {short(user.address)})
                                    </option>
                                ))}
                        </select>
                        <button
                            className="btn-primary"
                            disabled={!target || busy}
                            onClick={handleTransfer}
                        >
                            {busy ? "⏳ Transferring…" : "🔄 Transfer Custody"}
                        </button>
                    </div>
                    {error && (
                        <p className="error-text">{error}</p>
                    )}
                </Panel>
            )}

            {showCancel && onCancel && (
                <Panel title="🚫 Cancel Shipment">
                    <p>
                        Cancel this shipment due to temperature violation or other issue.
                        This action cannot be undone.
                    </p>
                    <button
                        className="btn-danger"
                        disabled={busy}
                        onClick={handleCancel}
                    >
                        {busy ? "⏳ Cancelling…" : (cancelLabel ?? "🚫 Cancel Shipment")}
                    </button>
                    {error && (
                        <p className="error-text">{error}</p>
                    )}
                </Panel>
            )}

            {showReshipment && onReshipment && (
                <Panel title="🔄 Request Re-shipment">
                    <p>
                        Request a re-shipment due to temperature violation.
                        The manufacturer will review and approve.
                    </p>
                    <button
                        className="btn-warning"
                        disabled={busy}
                        onClick={handleReshipment}
                    >
                        {busy ? "⏳ Requesting…" : (reshipmentLabel ?? "🔄 Request Re-shipment")}
                    </button>
                    {error && (
                        <p className="error-text">{error}</p>
                    )}
                </Panel>
            )}

            {showContinue && onContinue && (
                <Panel title="✅ Continue Shipment">
                    <p>
                        Acknowledge the temperature violation and continue
                        the shipment. The current custodian has reviewed
                        and approved proceeding despite the violation.
                    </p>
                    <button
                        className="btn-primary"
                        disabled={busy}
                        onClick={handleContinue}
                    >
                        {busy ? "⏳ Processing…" : (continueLabel ?? "✅ Continue Shipment")}
                    </button>
                    {error && (
                        <p className="error-text">{error}</p>
                    )}
                </Panel>
            )}

            {showClose && onClose && (
                <Panel title="🏁 Finalize Shipment">
                    <p>
                        Confirm receipt and mark shipment as{" "}
                        <strong>COMPLETED</strong>. This is the final step of the
                        cold chain lifecycle.
                    </p>
                    <button
                        className="btn-close"
                        disabled={busy}
                        onClick={async () => {
                            setBusy(true);
                            setError("");
                            try {
                                await onClose();
                            } catch (closeError) {
                                setError(messageOf(closeError));
                            } finally {
                                setBusy(false);
                            }
                        }}
                    >
                        {busy ? "⏳ Completing…" : (closeLabel ?? "✅ Confirm Receipt & Complete Shipment")}
                    </button>
                    {error && (
                        <p className="error-text">{error}</p>
                    )}
                </Panel>
            )}

            <p className="detail-note">
                You are viewing as {short(wallet)}
            </p>
        </div>
    );
}
