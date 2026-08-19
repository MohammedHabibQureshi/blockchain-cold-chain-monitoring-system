import express from "express";
import cors from "cors";
import { ethers } from "ethers";
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { startSimulator, setShipmentId } from "./simulator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const PORT = 3000;

// ============================================
// BLOCKCHAIN CONNECTION
// ============================================

const RPC_URL = process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545";
const CONTRACT_ADDRESS = process.env.COLDCHAIN_CONTRACT || "0xCCc9C07a789760CE47082b999e37f1a4D7E40899";

const provider = new ethers.JsonRpcProvider(RPC_URL);

let signer: ethers.NonceManager;
let signerAddress: string;
let coldChainContract: ethers.Contract;
let readContract: ethers.Contract;

async function initBlockchain() {
  try {
    const artifactPath = join(__dirname, "..", "..", "blockchain", "artifacts", "contracts", "ColdChain.sol", "ColdChain.json");
    const artifact = JSON.parse(readFileSync(artifactPath, "utf-8"));
    const abi = artifact.abi;

    // Read-only contract using provider (supports call operations)
    readContract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    const accounts = await provider.send("eth_accounts", []);
    const privateKey = process.env.GANACHE_PRIVATE_KEY;

    let rawSigner: ethers.JsonRpcSigner | ethers.Wallet;
    if (privateKey) {
      rawSigner = new ethers.Wallet(privateKey, provider);
    } else {
      rawSigner = await provider.getSigner(accounts[0]);
    }

    const tempSigner = new ethers.NonceManager(rawSigner);
    signerAddress = await tempSigner.getAddress();

    coldChainContract = new ethers.Contract(CONTRACT_ADDRESS, abi, tempSigner);

    const [adminAddr, tempSignerRole] = await Promise.all([
      readContract.admin(),
      readContract.getUserRole(signerAddress)
    ]);

    console.log("Connected to contract at:", CONTRACT_ADDRESS);
    console.log("Admin:", adminAddr);
    console.log("Temp signer:", signerAddress, "Role:", Number(tempSignerRole));

    if (Number(tempSignerRole) === 0) {
      const adminAccount = accounts.find((a: string) => a.toLowerCase() === adminAddr.toLowerCase());
      if (adminAccount) {
        const adminSigner = new ethers.NonceManager(await provider.getSigner(adminAccount));
        console.log("Temp signer has no role. Using admin to register temp signer as MANUFACTURER...");
        const tx = await coldChainContract.connect(adminSigner).registerUser(signerAddress, 2);
        await tx.wait();
        console.log("Temp signer registered as MANUFACTURER");
      } else {
        console.log("Admin not found in Ganache accounts, using accounts[0] as fallback");
        const fallbackSigner = new ethers.NonceManager(await provider.getSigner(accounts[0]));
        coldChainContract = coldChainContract.connect(fallbackSigner);
        signer = fallbackSigner;
        console.log("Signer:", signerAddress);
        return;
      }
    }

    signer = tempSigner;
    console.log("Signer:", signerAddress);

    const shipmentId = process.env.SHIPMENT_ID || "SHIP-001";
    try {
      const shipment = await coldChainContract.getShipment(shipmentId);
      const status = Number(shipment[7]);
      const exists = shipment[0] && shipment[0] !== "";
      if (!exists || status >= 7) {
        const reason = !exists ? "not found" : `cancelled/completed (status ${status})`;
        console.log(`Shipment ${shipmentId} ${reason}, creating new active one...`);
        const newId = shipmentId + "-" + Date.now();
        const tx = await coldChainContract.createShipment(newId, 2, 8);
        await tx.wait();
        console.log(`Created new shipment: ${newId}`);
        setShipmentId(newId);
      } else {
        console.log(`Shipment ${shipmentId} exists (status ${status})`);
      }
    } catch {
      console.log(`Shipment ${shipmentId} check failed, creating...`);
      const fallbackId = shipmentId + "-" + Date.now();
      const tx = await coldChainContract.createShipment(fallbackId, 2, 8);
      await tx.wait();
      console.log(`Created shipment: ${fallbackId}`);
      setShipmentId(fallbackId);
    }
  } catch (err) {
    console.error("Failed to initialize blockchain:", err);
  }
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());

app.use(express.json());

// ============================================
// IN-MEMORY CACHE
// ============================================

interface CacheEntry { data: any; expires: number; }
const cache = new Map<string, CacheEntry>();

function cached(key: string, ttlMs: number): any | undefined {
    const entry = cache.get(key);
    if (entry && entry.expires > Date.now()) return entry.data;
    cache.delete(key);
    return undefined;
}

function cacheSet(key: string, data: any, ttlMs: number): void {
    cache.set(key, { data, expires: Date.now() + ttlMs });
}

function invalidate(pattern: string): void {
    for (const key of cache.keys()) {
        if (key.startsWith(pattern)) cache.delete(key);
    }
}

// ============================================
// HELPERS
// ============================================

const STATUS_NAMES = [
  "CREATED", "ASSIGNED", "IN_TRANSIT", "AT_WAREHOUSE",
  "AT_DISTRIBUTOR", "AT_HOSPITAL", "COMPLETED", "CANCELLED", "RESHIPMENT_REQUESTED"
];

// ============================================
// IN-MEMORY INDEX (event-log based, O(1) per-shipment lookups)
// ============================================

const readingsByShipment = new Map<string, any[]>();
const violationsByShipment = new Map<string, any[]>();
let indexBuiltAt = 0;
const INDEX_TTL = 30_000;
let indexRefreshing = false;

async function refreshIndex() {
    const now = Date.now();
    if (now - indexBuiltAt < INDEX_TTL) return;
    if (indexRefreshing) return;
    indexRefreshing = true;

    try {
        const readingLogs = await readContract.queryFilter(
            readContract.filters.TemperatureRecorded()
        );
        readingsByShipment.clear();
        for (const log of readingLogs) {
            const topic = log.topics?.[1] ?? "";
            const reading = {
                shipmentId: topic,
                temperature: Number(log.args[1]),
                humidity: Number(log.args[2]),
                timestamp: log.args[3].toString(),
                violation: log.args[4],
                dataHash: log.args[5]
            };
            const existing = readingsByShipment.get(topic) ?? [];
            existing.push(reading);
            readingsByShipment.set(topic, existing);
        }
    } catch {
        // keep previous cache
    }

    try {
        const violationLogs = await readContract.queryFilter(
            readContract.filters.TemperatureViolation()
        );
        violationsByShipment.clear();
        for (const log of violationLogs) {
            const topic = log.topics?.[1] ?? "";
            const violation = {
                shipmentId: topic,
                temperature: Number(log.args[1]),
                timestamp: log.args[2].toString(),
                dataHash: log.args[3]
            };
            const existing = violationsByShipment.get(topic) ?? [];
            existing.push(violation);
            violationsByShipment.set(topic, existing);
        }
    } catch {
        // keep previous cache
    }

    indexBuiltAt = Date.now();
    indexRefreshing = false;
}

function getShipmentTopicHash(sid: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(sid));
}

function parseShipment(shipment: any) {
    return {
        shipmentId: shipment[0] ?? shipment.shipmentId,
        manufacturer: shipment[1] ?? shipment.manufacturer,
        currentCustodian: shipment[2] ?? shipment.currentCustodian,
        assignedCustodian: shipment[3] ?? shipment.assignedCustodian,
        minTemperature: Number(shipment[4] ?? shipment.minTemperature),
        maxTemperature: Number(shipment[5] ?? shipment.maxTemperature),
        createdAt: (shipment[6] ?? shipment.createdAt).toString(),
        status: Number(shipment[7] ?? shipment.status),
        statusName: STATUS_NAMES[Number(shipment[7] ?? shipment.status)] ?? "UNKNOWN",
        active: Number(shipment[7] ?? shipment.status) < 7
    };
}

function parseReading(reading: any) {
    return {
        shipmentId: reading[0] ?? reading.shipmentId,
        temperature: Number(reading[1] ?? reading.temperature),
        humidity: Number(reading[2] ?? reading.humidity),
        timestamp: (reading[3] ?? reading.timestamp).toString(),
        violation: reading[4] ?? reading.violation,
        dataHash: reading[5] ?? reading.dataHash
    };
}

function parseViolation(violation: any) {
    return {
        shipmentId: violation[0] ?? violation.shipmentId,
        temperature: Number(violation[1] ?? violation.temperature),
        timestamp: (violation[2] ?? violation.timestamp).toString(),
        reason: violation[3] ?? violation.reason,
        dataHash: violation[4] ?? violation.dataHash
    };
}

function parseCustodyEvent(event: any) {
    return {
        shipmentId: event[0] ?? event.shipmentId,
        from: event[1] ?? event.from,
        to: event[2] ?? event.to,
        timestamp: (event[3] ?? event.timestamp).toString(),
        blockNumber: (event[4] ?? event.blockNumber).toString()
    };
}

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", async (_req, res) => {
    try {
        res.json({
            success: true,
            message: "Backend API is running",
            contract: readContract ? readContract.target : "not initialized"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Backend health check failed" });
    }
});

// ============================================
// CONFIG (contract address + ABI for MetaMask)
// ============================================

app.get("/api/config", async (_req, res) => {
    try {
        if (!readContract) {
            return res.status(500).json({ success: false, error: "Contract not initialized" });
        }

        const cachedConfig = cached("config", 30_000);
        if (cachedConfig) return res.json(cachedConfig);

        const response = {
            success: true,
            data: {
                contractAddress: readContract.target,
                rpcUrl: RPC_URL,
                expectedChainId: 1337,
                abi: readContract.interface.formatJson()
            }
        };
        cacheSet("config", response, 30_000);
        res.json(response);
    } catch (error) {
        console.error("Config error:", error);
        res.status(500).json({ success: false, error: "Failed to load contract config" });
    }
});

// ============================================
// USERS
// ============================================

const ROLE_NAMES = ["NONE", "ADMIN", "MANUFACTURER", "TRANSPORTER", "WAREHOUSE", "DISTRIBUTOR", "HOSPITAL"];

app.get("/api/users", async (_req, res) => {
    try {
        const count = await readContract.getUserCount();
        const users = [];
        for (let i = 0n; i < count; i++) {
            const user = await readContract.getUserAt(i);
            let name = "";
            try {
                name = await readContract.participantNames(user[0]) || "";
            } catch {
                // participantNames not available in deployed contract
            }
            users.push({
                address: user[0],
                role: Number(user[1]),
                roleName: ROLE_NAMES[Number(user[1])],
                name: name || ""
            });
        }
        const response = { success: true, count: users.length, data: users };
        res.json(response);
    } catch (error) {
        console.error("Users error:", error);
        res.status(500).json({ success: false, error: "Failed to get users" });
    }
});

app.get("/api/user/:address", async (req, res) => {
    try {
        const role = await readContract.getUserRole(req.params.address);
        let name = "";
        try {
            name = await readContract.participantNames(req.params.address) || "";
        } catch {
            // participantNames not available in deployed contract
        }
        res.json({
            success: true,
            data: {
                address: req.params.address,
                role: Number(role),
                roleName: ROLE_NAMES[Number(role)],
                name: name || ""
            }
        });
    } catch (error) {
        console.error("User error:", error);
        res.status(500).json({ success: false, error: "Failed to get user" });
    }
});

// ============================================
// SHIPMENTS
// ============================================

app.get("/api/shipments", async (_req, res) => {
    try {
        const shipments = await readContract.getAllShipments();
        const response = { success: true, count: shipments.length, data: shipments.map(parseShipment) };
        res.json(response);
    } catch (error) {
        console.error("Shipments error:", error);
        res.status(500).json({ success: false, error: "Failed to get shipments" });
    }
});

app.get("/api/shipment/:shipmentId", async (req, res) => {
    try {
        const shipment = await readContract.getShipment(req.params.shipmentId);
        res.json({ success: true, data: parseShipment(shipment) });
    } catch (error) {
        console.error("Shipment error:", error);
        res.status(500).json({ success: false, error: "Failed to get shipment" });
    }
});

function getEventShipmentId(log: any): string {
    const val = log.args[0];
    if (typeof val === "string" && !val.startsWith("0x")) return val;
    return val?.hash ?? String(val);
}

app.get("/api/shipment/:shipmentId/latest", async (req, res) => {
    try {
        const sid = req.params.shipmentId;
        const cacheKey = `latest-${sid}`;
        const cachedData = cached(cacheKey, 5_000);
        if (cachedData) return res.json(cachedData);

        if (readingsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const hash = getShipmentTopicHash(sid);
        const all = readingsByShipment.get(hash) ?? [];
        const latest = all.length > 0 ? all[all.length - 1] : null;
        const result = { success: true, data: latest ? { ...latest, shipmentId: sid } : null };
        cacheSet(cacheKey, result, 5_000);
        res.json(result);
    } catch (error) {
        console.error("Latest reading error:", error);
        res.status(500).json({ success: false, error: "Failed to get latest reading" });
    }
});

app.get("/api/shipment/:shipmentId/readings", async (req, res) => {
    try {
        const sid = req.params.shipmentId;
        const cacheKey = `readings-${sid}`;
        const cachedData = cached(cacheKey, 5_000);
        if (cachedData) return res.json(cachedData);

        if (readingsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const hash = getShipmentTopicHash(sid);
        const all = readingsByShipment.get(hash) ?? [];
        const limit = parseInt(req.query.limit as string) || 50;
        const limited = all.slice(-limit).map(r => ({ ...r, shipmentId: sid }));
        const result = { success: true, count: limited.length, data: limited };
        cacheSet(cacheKey, result, 5_000);
        res.json(result);
    } catch (error) {
        console.error("Readings error:", error);
        res.status(500).json({ success: false, error: "Failed to get readings" });
    }
});

app.get("/api/shipment/:shipmentId/violations", async (req, res) => {
    try {
        const sid = req.params.shipmentId;
        const cacheKey = `violations-${sid}`;
        const cachedData = cached(cacheKey, 5_000);
        if (cachedData) return res.json(cachedData);

        if (violationsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const hash = getShipmentTopicHash(sid);
        const all = violationsByShipment.get(hash) ?? [];
        const result = { success: true, count: all.length, data: all.map(v => ({ ...v, shipmentId: sid })) };
        cacheSet(cacheKey, result, 5_000);
        res.json(result);
    } catch (error) {
        console.error("Violations error:", error);
        res.status(500).json({ success: false, error: "Failed to get violations" });
    }
});

app.get("/api/shipment/:shipmentId/custody", async (req, res) => {
    try {
        const sid = req.params.shipmentId;
        const cacheKey = `custody-${sid}`;
        const cachedData = cached(cacheKey, 10_000);
        if (cachedData) return res.json(cachedData);

        const allLogs = await readContract.queryFilter(
            readContract.filters.CustodyTransferred()
        );
        const targetHash = getShipmentTopicHash(sid);
        const matching = allLogs.filter(
            (log: any) => {
                const rawTopic = log.topics?.[1];
                return rawTopic === targetHash;
            }
        );
        const events = matching.map((log: any) => ({
            shipmentId: sid,
            from: log.args[1],
            to: log.args[2],
            timestamp: log.args[3].toString(),
            blockNumber: log.args[4].toString()
        }));
        const result = { success: true, count: events.length, data: events };
        cacheSet(cacheKey, result, 10_000);
        res.json(result);
    } catch (error) {
        console.error("Custody error:", error);
        res.status(500).json({ success: false, error: "Failed to get custody history" });
    }
});

app.get("/api/shipments/custodian/:address", async (req, res) => {
    try {
        const ids = await readContract.getShipmentsByCustodian(req.params.address);
        const shipments = [];
        for (const id of ids) {
            const s = await readContract.getShipment(id);
            shipments.push(parseShipment(s));
        }
        res.json({ success: true, count: shipments.length, data: shipments });
    } catch (error) {
        console.error("Shipments by custodian error:", error);
        res.status(500).json({ success: false, error: "Failed to get shipments by custodian" });
    }
});

app.get("/api/shipments/assigned/:address", async (req, res) => {
    try {
        const ids = await readContract.getShipmentsByAssigned(req.params.address);
        const shipments = [];
        for (const id of ids) {
            const s = await readContract.getShipment(id);
            shipments.push(parseShipment(s));
        }
        res.json({ success: true, count: shipments.length, data: shipments });
    } catch (error) {
        console.error("Shipments by assigned error:", error);
        res.status(500).json({ success: false, error: "Failed to get shipments by assigned custodian" });
    }
});

app.get("/api/shipments/manufacturer/:address", async (req, res) => {
    try {
        const ids = await readContract.getShipmentsByManufacturer(req.params.address);
        const shipments = [];
        for (const id of ids) {
            const s = await readContract.getShipment(id);
            shipments.push(parseShipment(s));
        }
        res.json({ success: true, count: shipments.length, data: shipments });
    } catch (error) {
        console.error("Shipments by manufacturer error:", error);
        res.status(500).json({ success: false, error: "Failed to get shipments by manufacturer" });
    }
});

// ============================================
// USER MANAGEMENT (Admin only via blockchain)
// ============================================

app.get("/api/shipment/:shipmentId/cancellation-reason", async (req, res) => {
    try {
        let reason = "";
        try {
            reason = await readContract.cancellationReasons(req.params.shipmentId) || "";
        } catch {
            // cancellationReasons not available in deployed contract
        }
        res.json({ success: true, data: { shipmentId: req.params.shipmentId, reason: reason || "" } });
    } catch (error) {
        console.error("Cancellation reason error:", error);
        res.status(500).json({ success: false, error: "Failed to get cancellation reason" });
    }
});

app.get("/api/shipment/:shipmentId/participant-name/:address", async (req, res) => {
    try {
        let name = "";
        try {
            name = await readContract.participantNames(req.params.address) || "";
        } catch {
            // participantNames not available in deployed contract
        }
        res.json({ success: true, data: { address: req.params.address, name: name || "" } });
    } catch (error) {
        console.error("Participant name error:", error);
        res.status(500).json({ success: false, error: "Failed to get participant name" });
    }
});

app.get("/api/role-count/:role", async (req, res) => {
    try {
        const roleName = req.params.role.toUpperCase();
        const roleMap: Record<string, number> = {
            "MANUFACTURER": 2,
            "TRANSPORTER": 3,
            "WAREHOUSE": 4,
            "DISTRIBUTOR": 5,
            "HOSPITAL": 6
        };
        const roleValue = roleMap[roleName];
        if (roleValue === undefined) {
            return res.status(400).json({ success: false, error: "Invalid role" });
        }
        let count = 0;
        try {
            count = await readContract.getRoleCount(roleValue);
            count = Number(count);
        } catch {
            // getRoleCount not available in deployed contract, compute manually
            const userCount = await readContract.getUserCount();
            count = 0;
            for (let i = 0n; i < userCount; i++) {
                const user = await readContract.getUserAt(i);
                if (Number(user[1]) === roleValue) count++;
            }
        }
        res.json({ success: true, data: { role: roleName, count: Number(count) } });
    } catch (error) {
        console.error("Role count error:", error);
        res.status(500).json({ success: false, error: "Failed to get role count" });
    }
});

// ============================================
// TEMPERATURE
// ============================================

app.get("/api/temperature/count", async (_req, res) => {
    try {
        if (readingsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const count = [...readingsByShipment.values()].flat().length;
        res.json({ success: true, count: count.toString() });
    } catch (error) {
        console.error("Temperature count error:", error);
        res.status(500).json({ success: false, error: "Failed to get temperature count" });
    }
});

app.get("/api/temperature/latest", async (_req, res) => {
    try {
        if (readingsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const all = [...readingsByShipment.values()].flat();
        if (all.length === 0) {
            return res.json({ success: true, data: null, message: "No temperature readings found" });
        }
        res.json({ success: true, data: all[all.length - 1] });
    } catch (error) {
        console.error("Latest temperature error:", error);
        res.status(500).json({ success: false, error: "Failed to get latest temperature" });
    }
});

app.get("/api/temperature/history", async (_req, res) => {
    try {
        if (readingsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const all = [...readingsByShipment.values()].flat();
        res.json({ success: true, count: all.length, data: all });
    } catch (error) {
        console.error("Temperature history error:", error);
        res.status(500).json({ success: false, error: "Failed to get temperature history" });
    }
});

// ============================================
// VIOLATIONS
// ============================================

app.get("/api/violations/count", async (_req, res) => {
    try {
        if (violationsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const count = [...violationsByShipment.values()].flat().length;
        res.json({ success: true, count: count.toString() });
    } catch (error) {
        console.error("Violation count error:", error);
        res.status(500).json({ success: false, error: "Failed to get violation count" });
    }
});

app.get("/api/violations", async (_req, res) => {
    try {
        if (violationsByShipment.size === 0 || (Date.now() - indexBuiltAt > INDEX_TTL)) {
            refreshIndex().catch(() => {});
        }
        const all = [...violationsByShipment.values()].flat();
        const response = { success: true, count: all.length, data: all };
        res.json(response);
    } catch (error) {
        console.error("Violation history error:", error);
        res.status(500).json({ success: false, error: "Failed to get violations" });
    }
});

// ============================================
// CUSTODY
// ============================================

app.get("/api/custody", async (_req, res) => {
    try {
        const logs = await readContract.queryFilter(
            readContract.filters.CustodyTransferred()
        );
        const events = logs.map((log: any) => ({
            shipmentId: log.args[0],
            from: log.args[1],
            to: log.args[2],
            timestamp: log.args[3].toString(),
            blockNumber: log.args[4].toString()
        }));
        res.json({ success: true, count: events.length, data: events });
    } catch (error) {
        console.error("Custody history error:", error);
        res.status(500).json({ success: false, error: "Failed to get custody history" });
    }
});

// ============================================
// IOT GATEWAY - RECORD TEMPERATURE
// ============================================

app.post("/api/temperature", async (req, res) => {
    try {
        const { shipmentId, temperature, humidity } = req.body;

        if (!shipmentId || temperature === undefined) {
            return res.status(400).json({ success: false, error: "shipmentId and temperature are required" });
        }

        const timestamp = req.body.timestamp ?? Math.floor(Date.now() / 1000);
        const dataHash = ethers.keccak256(
            ethers.toUtf8Bytes(`${shipmentId}:${temperature}:${humidity ?? 0}:${timestamp}`)
        );

        const shipment = await readContract.getShipment(shipmentId);
        const minTemperature = Number(shipment[4]);
        const maxTemperature = Number(shipment[5]);
        const violation = temperature < minTemperature || temperature > maxTemperature;

        const tx = await coldChainContract.recordTemperature(
            shipmentId,
            Math.round(temperature),
            Math.round(humidity ?? 0),
            dataHash
        );

        const receipt = await tx.wait();

        invalidate("shipments");
        invalidate("violations");
        lastIndexRefresh = 0;

        res.json({
            success: true,
            data: {
                shipmentId,
                temperature: Number(temperature),
                humidity: Number(humidity ?? 0),
                timestamp,
                violation,
                dataHash,
                minTemperature,
                maxTemperature,
                transactionHash: tx.hash,
                blockNumber: receipt?.blockNumber?.toString() ?? ""
            }
        });
    } catch (error: any) {
        console.error("Record temperature error:", error?.reason ?? error?.message ?? error);
        res.status(500).json({ success: false, error: error?.reason ?? error?.message ?? "Failed to record temperature" });
    }
});

// ============================================
// START SERVER
// ============================================

async function startServer(port: number, attempt = 1) {
    await initBlockchain();

    const server = app.listen(port, async () => {
        console.log("\n🚀 Backend API running on http://localhost:" + port);
        console.log("⛓️ Connected contract:", readContract ? readContract.target : "not initialized");
        if (coldChainContract) {
            startSimulator(coldChainContract);
        } else {
            console.warn("⚠️ Simulator not started — contract not initialized. Start Ganache and restart the server.");
        }
        // Pre-build in-memory index
        console.log("📊 Building in-memory index...");
        await refreshIndex();
        const readingCount = [...readingsByShipment.values()].flat().length;
        const violationCount = [...violationsByShipment.values()].flat().length;
        console.log(`📊 Index built: ${readingCount} readings, ${violationCount} violations`);
    });

    server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
            console.warn(`⚠️ Port ${port} already in use, trying port ${port + 1}...`);
            if (attempt < 5) {
                startServer(port + 1, attempt + 1);
            } else {
                console.error("❌ Could not find available port after 5 attempts");
                process.exit(1);
            }
        } else {
            console.error("❌ Server error:", error);
            process.exit(1);
        }
    });
}

startServer(PORT);

process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
});
