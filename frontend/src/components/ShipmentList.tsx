import { useState } from "react";
import type { Shipment, User } from "../types";
import ShipmentDetail from "./ShipmentDetail";
import { Empty, ShipmentCard } from "./ui";

interface Props {
    shipments: Shipment[];
    wallet: string;
    users: User[];
    transferUsers?: User[];
    emptyMessage: string;
    transferEnabled?: boolean;
    transferLabel?: string;
    onTransfer?: (shipmentId: string, to: string) => Promise<void>;
    closeEnabled?: boolean;
    closeLabel?: string;
    onClose?: (shipmentId: string) => Promise<void>;
    acceptEnabled?: boolean;
    acceptLabel?: string;
    onAccept?: (shipmentId: string) => Promise<void>;
    cancelEnabled?: boolean;
    cancelLabel?: string;
    onCancel?: (shipmentId: string) => Promise<void>;
    reshipmentEnabled?: boolean;
    reshipmentLabel?: string;
    onReshipment?: (shipmentId: string) => Promise<void>;
    continueEnabled?: boolean;
    continueLabel?: string;
    onContinue?: (shipmentId: string) => Promise<void>;
}

export default function ShipmentList({
    shipments,
    wallet,
    users,
    transferUsers,
    emptyMessage,
    transferEnabled,
    transferLabel,
    onTransfer,
    closeEnabled,
    closeLabel,
    onClose,
    acceptEnabled,
    acceptLabel,
    onAccept,
    cancelEnabled,
    cancelLabel,
    onCancel,
    reshipmentEnabled,
    reshipmentLabel,
    onReshipment,
    continueEnabled,
    continueLabel,
    onContinue
}: Props) {

    const [selected, setSelected] =
        useState<string | null>(null);

    const current = selected
        ? shipments.find(
            (item) => item.shipmentId === selected
        )
        : null;

    return (
        <div>
            {shipments.length === 0 ? (
                <Empty message={emptyMessage} />
            ) : (
                <div className="shipment-grid">
                    {shipments.map((shipment) => (
                        <ShipmentCard
                            key={shipment.shipmentId}
                            shipment={shipment}
                            onClick={() =>
                                setSelected(shipment.shipmentId)
                            }
                            extra={
                                shipment.currentCustodian.toLowerCase() ===
                                    wallet.toLowerCase() && (
                                    <div className="custodian-tag">
                                        👑 You hold custody
                                    </div>
                                )
                            }
                        />
                    ))}
                </div>
            )}

            {current && (
                <div className="detail-wrapper">
                    <div className="detail-head">
                        <h3>Details: {current.shipmentId}</h3>
                        <button
                            className="btn-ghost"
                            onClick={() => setSelected(null)}
                        >
                            ✖ Close
                        </button>
                    </div>
                    <ShipmentDetail
                        shipmentId={current.shipmentId}
                        wallet={wallet}
                        users={users}
                        transferUsers={transferUsers}
                        canTransfer={
                            Boolean(transferEnabled && onTransfer) &&
                            current.currentCustodian.toLowerCase() ===
                                wallet.toLowerCase() &&
                            current.status !== 6 &&
                            current.status !== 7
                        }
                        transferLabel={transferLabel}
                        onTransfer={
                            onTransfer
                                ? (to) => onTransfer(current.shipmentId, to)
                                : undefined
                        }
                        showClose={
                            Boolean(closeEnabled && onClose) &&
                            current.currentCustodian.toLowerCase() ===
                                wallet.toLowerCase() &&
                            current.status !== 6 &&
                            current.status !== 7
                        }
                        closeLabel={closeLabel}
                        onClose={
                            onClose
                                ? () => onClose(current.shipmentId)
                                : undefined
                        }
                        showAccept={
                            Boolean(acceptEnabled && onAccept) &&
                            current.assignedCustodian.toLowerCase() ===
                                wallet.toLowerCase() &&
                            current.status === 1
                        }
                        acceptLabel={acceptLabel}
                        onAccept={
                            onAccept
                                ? () => onAccept(current.shipmentId)
                                : undefined
                        }
                        showCancel={
                            Boolean(cancelEnabled && onCancel) &&
                            current.currentCustodian.toLowerCase() ===
                                wallet.toLowerCase() &&
                            current.status !== 6 &&
                            current.status !== 7
                        }
                        cancelLabel={cancelLabel}
                        onCancel={
                            onCancel
                                ? () => onCancel(current.shipmentId)
                                : undefined
                        }
                        showReshipment={
                            Boolean(reshipmentEnabled && onReshipment) &&
                            current.currentCustodian.toLowerCase() ===
                                wallet.toLowerCase() &&
                            current.status !== 6 &&
                            current.status !== 7 &&
                            current.status !== 8
                        }
                        reshipmentLabel={reshipmentLabel}
                        onReshipment={
                            onReshipment
                                ? () => onReshipment(current.shipmentId)
                                : undefined
                        }
                        showContinue={
                            Boolean(continueEnabled && onContinue) &&
                            current.currentCustodian.toLowerCase() ===
                                wallet.toLowerCase() &&
                            current.status !== 6 &&
                            current.status !== 7 &&
                            current.status !== 8
                        }
                        continueLabel={continueLabel}
                        onContinue={
                            onContinue
                                ? () => onContinue(current.shipmentId)
                                : undefined
                        }
                    />
                </div>
            )}
        </div>
    );
}
