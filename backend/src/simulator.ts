let SHIPMENT_ID =
    process.env.SHIPMENT_ID || "SHIP-001";

const MIN_TEMPERATURE = 2;

const MAX_TEMPERATURE = 8;

let txLock: Promise<void> = Promise.resolve();

function generateTemperature(): number {

    const spike = Math.random() < 0.18;

    if (spike) {

        const cold = Math.random() < 0.5;

        if (cold) {

            return Number(
                (MIN_TEMPERATURE - (Math.random() * 3 + 0.5)).toFixed(2)
            );
        }

        return Number(
            (MAX_TEMPERATURE + (Math.random() * 3 + 0.5)).toFixed(2)
        );
    }

    return Number(
        (MIN_TEMPERATURE + Math.random() * (MAX_TEMPERATURE - MIN_TEMPERATURE)).toFixed(2)
    );
}

function generateHumidity(): number {

    return Number(
        (50 + Math.random() * 20).toFixed(2)
    );
}

export async function sendTemperature(
    contract: any,
    shipmentId?: string
) {

    const id = shipmentId || SHIPMENT_ID;

    const temperature = generateTemperature();

    const humidity = generateHumidity();

    const timestamp = Math.floor(Date.now() / 1000);

    // Chain onto the lock so only one tx is in-flight at a time
    txLock = txLock.then(async () => {
        try {

            const { ethers } = await import("ethers");
            const dataHash = ethers.keccak256(
                ethers.toUtf8Bytes(
                    `${id}:${temperature}:${humidity}:${timestamp}`
                )
            );

            const tx = await contract.recordTemperature(
                id,
                Math.round(temperature),
                Math.round(humidity),
                dataHash
            );

            await tx.wait();

            console.log(`📡 Simulator: ${id} → ${temperature}°C, ${humidity}%`);

        } catch (error: any) {

            console.error("❌ Simulator error:", error?.message ?? error);
        }
    });

    return txLock;
}

export function setShipmentId(id: string) {
    SHIPMENT_ID = id;
}

async function recordForAllActive(contract: any) {
    try {
        const allShipments = await contract.getAllShipments();
        const active = allShipments.filter(
            (s: any) => {
                const status = Number(s[7] ?? s.status);
                return status >= 0 && status <= 5;
            }
        );

        const batch = active.slice(0, 3);

        for (const shipment of batch) {
            const id = shipment[0] ?? shipment.shipmentId;
            await sendTemperature(contract, id);
        }
    } catch (error: any) {
        console.error("❌ Simulator batch error:", error?.message ?? error);
    }
}

async function scheduleBatch(contract: any, intervalMs: number) {
    await recordForAllActive(contract);
    setTimeout(() => scheduleBatch(contract, intervalMs), intervalMs);
}

export function startSimulator(contract: any) {

    console.log("🌡️ Temperature simulator started");

    console.log(`Shipment: ${SHIPMENT_ID}`);

    console.log(`Range: ${MIN_TEMPERATURE}°C – ${MAX_TEMPERATURE}°C`);

    setTimeout(() => {
        scheduleBatch(contract, 8000);
    }, 3000);
}
