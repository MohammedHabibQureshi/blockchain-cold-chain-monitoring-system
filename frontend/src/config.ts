export const API_URL = "http://localhost:3000/api";

export const EXPECTED_CHAIN_ID = 1337;

export const EXPECTED_CHAIN_NAME = "COLDCHAINNETWORK";

export const ROLE_NAMES = [
    "NONE",
    "ADMIN",
    "MANUFACTURER",
    "TRANSPORTER",
    "WAREHOUSE",
    "DISTRIBUTOR",
    "HOSPITAL"
] as const;

export const ROLE_EMOJIS: Record<number, string> = {
    0: "🚫",
    1: "👑",
    2: "🏭",
    3: "🚚",
    4: "🏢",
    5: "📦",
    6: "🏥"
};

export const ROLE_LABELS: Record<number, string> = {
    0: "None",
    1: "Admin",
    2: "Manufacturer",
    3: "Transporter",
    4: "Warehouse",
    5: "Distributor",
    6: "Hospital"
};

export const REGISTRABLE_ROLES = [
    { value: 2, label: "Manufacturer" },
    { value: 3, label: "Transporter" },
    { value: 4, label: "Warehouse" },
    { value: 5, label: "Distributor" },
    { value: 6, label: "Hospital" }
];

export const SHIPMENT_STATUS: Record<number, { label: string; color: string; emoji: string }> = {
    0: { label: "CREATED", color: "badge-safe", emoji: "📦" },
    1: { label: "ASSIGNED", color: "badge-warning", emoji: "📋" },
    2: { label: "IN_TRANSIT", color: "badge-info", emoji: "🚚" },
    3: { label: "AT_WAREHOUSE", color: "badge-info", emoji: "🏢" },
    4: { label: "AT_DISTRIBUTOR", color: "badge-info", emoji: "📦" },
    5: { label: "AT_HOSPITAL", color: "badge-info", emoji: "🏥" },
    6: { label: "COMPLETED", color: "badge-completed", emoji: "✅" },
    7: { label: "CANCELLED", color: "badge-danger", emoji: "🚫" },
    8: { label: "RESHIPMENT_REQUESTED", color: "badge-warning", emoji: "🔄" }
};
