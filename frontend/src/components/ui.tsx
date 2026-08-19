import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { Shipment, TxState } from "../types";
import { SHIPMENT_STATUS } from "../config";
import { short } from "../utils";

export function Panel({
    title,
    children
}: {
    title: string;
    children: ReactNode;
}) {

    return (
        <section className="panel">
            <h2>{title}</h2>
            {children}
        </section>
    );
}

export function Card({
    children
}: {
    children: ReactNode;
}) {

    return (
        <div className="card">
            {children}
        </div>
    );
}

export function Loading({
    label = "Loading..."
}: {
    label?: string;
}) {

    return (
        <div className="loading">
            ⏳ {label}
        </div>
    );
}

export function Empty({
    message
}: {
    message: string;
}) {

    return (
        <p className="empty">{message}</p>
    );
}

export function StatusBadge({
    ok,
    label
}: {
    ok: boolean;
    label: string;
}) {

    return (
        <span className={
            ok
                ? "badge badge-safe"
                : "badge badge-danger"
        }>
            {ok ? "🟢" : "🚨"} {label}
        </span>
    );
}

export function TxBanner({
    tx,
    onDismiss
}: {
    tx: TxState;
    onDismiss?: () => void;
}) {

    const timer = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (tx.status === "success" || tx.status === "error") {
            timer.current = setTimeout(() => {
                onDismiss?.();
            }, 5000);
        }
        return () => clearTimeout(timer.current);
    }, [tx, onDismiss]);

    if (tx.status === "idle") return null;

    if (tx.status === "pending") {

        return (
            <div className="tx-banner tx-pending">
                ⏳ {tx.message}
            </div>
        );
    }

    if (tx.status === "success") {

        return (
            <div className="tx-banner tx-success">
                <p>✅ {tx.message}</p>
                {tx.txHash && (
                    <p>
                        <strong>Transaction:</strong>{" "}
                        <code className="inline">{tx.txHash}</code>
                    </p>
                )}
                {tx.blockNumber && (
                    <p>
                        <strong>Block:</strong> {tx.blockNumber}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="tx-banner tx-error">
            ❌ {tx.message}
        </div>
    );
}

export function WalletInfo({
    wallet,
    roleLabel,
    roleEmoji
}: {
    wallet: string;
    roleLabel: string;
    roleEmoji: string;
}) {

    return (
        <div className="wallet-strip">
            <span className="wallet-chip">
                💰 {short(wallet)}
            </span>
            <span className="wallet-chip">
                {roleEmoji} {roleLabel}
            </span>
            <code className="inline full-address">
                {wallet}
            </code>
        </div>
    );
}

export function StatCard({
    emoji,
    label,
    value
}: {
    emoji: string;
    label: string;
    value: ReactNode;
}) {

    return (
        <div className="stat-card">
            <div className="stat-emoji">{emoji}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
        </div>
    );
}

export function ShipmentCard({
    shipment,
    onClick,
    extra
}: {
    shipment: Shipment;
    onClick?: () => void;
    extra?: ReactNode;
}) {

    const statusInfo = SHIPMENT_STATUS[shipment.status] || {
        label: shipment.active ? "ACTIVE" : "COMPLETED",
        color: shipment.active ? "badge-safe" : "badge-completed",
        emoji: "📦"
    };

    return (
        <div
            className={
                onClick
                    ? "shipment-card clickable"
                    : "shipment-card"
            }
            onClick={onClick}
        >
            <div className="shipment-card-head">
                <strong>📦 {shipment.shipmentId}</strong>
                <span className={`badge ${statusInfo.color}`}>
                    {statusInfo.emoji} {statusInfo.label}
                </span>
            </div>
            <div className="shipment-card-body">
                <p>
                    Range:{" "}
                    <strong>
                        {shipment.minTemperature}°C – {shipment.maxTemperature}°C
                    </strong>
                </p>
                <p>
                    Custodian:{" "}
                    <strong>{short(shipment.currentCustodian)}</strong>
                </p>
                <p>
                    Manufacturer:{" "}
                    <strong>{short(shipment.manufacturer)}</strong>
                </p>
            </div>
            {extra}
        </div>
    );
}

export function TempBadge({
    temperature,
    min,
    max
}: {
    temperature: number | undefined;
    min: number;
    max: number;
}) {

    if (temperature === undefined || temperature === null) {

        return (
            <span className="badge badge-muted">
                NO READING
            </span>
        );
    }

    const safe = temperature >= min && temperature <= max;

    return (
        <StatusBadge
            ok={safe}
            label={safe ? "SAFE" : "VIOLATION"}
        />
    );
}
