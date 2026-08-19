export function short(address: string): string {

    if (!address) return "";

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTimestamp(timestamp: string): string {

    const number = Number(timestamp);

    if (!number) return "—";

    return new Date(number * 1000).toLocaleString();
}

export function messageOf(error: unknown): string {

    if (typeof error === "object" && error !== null) {

        const record = error as Record<string, unknown>;

        const shortMessage = record.shortMessage;

        const message = record.message;

        if (typeof shortMessage === "string") return shortMessage;

        if (typeof message === "string") return message;
    }

    return String(error);
}
