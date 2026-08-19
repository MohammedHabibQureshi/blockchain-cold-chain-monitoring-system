import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
  const accounts = await provider.listAccounts();

  const admin = accounts[0];
  const manufacturer = accounts[1];
  const transporter = accounts[2];
  const warehouse = accounts[3];
  const distributor = accounts[4];
  const hospital = accounts[5];

  const deployment = JSON.parse(fs.readFileSync("./deployment/deployment.json", "utf8"));
  const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/ColdChain.sol/ColdChain.json", "utf8"));

  const contractAdmin = new ethers.Contract(deployment.contractAddress, artifact.abi, admin);
  const contractMfr = new ethers.Contract(deployment.contractAddress, artifact.abi, manufacturer);
  const contractTrp = new ethers.Contract(deployment.contractAddress, artifact.abi, transporter);
  const contractWhs = new ethers.Contract(deployment.contractAddress, artifact.abi, warehouse);
  const contractDst = new ethers.Contract(deployment.contractAddress, artifact.abi, distributor);
  const contractHos = new ethers.Contract(deployment.contractAddress, artifact.abi, hospital);

  console.log("=== Creating Shipments ===\n");

  const shipments = [
    { id: "VACCINE-001", min: 2, max: 8 },
    { id: "INSULIN-002", min: -5, max: 10 },
    { id: "BLOOD-003", min: 1, max: 6 },
  ];

  for (const s of shipments) {
    const tx = await contractMfr.createShipment(s.id, s.min, s.max);
    await tx.wait();
    console.log(`✅ Created ${s.id} (range: ${s.min}°C to ${s.max}°C)`);
  }

  console.log("\n=== Transferring Custody: Manufacturer → Transporter ===\n");

  for (const s of shipments) {
    const tx = await contractMfr.transferCustody(s.id, transporter.address);
    await tx.wait();
    console.log(`✅ ${s.id} → Transporter`);
  }

  console.log("\n=== Recording Temperature Readings (Transporter) ===\n");

  const temps1 = [
    { temp: 5, humidity: 45 },
    { temp: 3, humidity: 50 },
    { temp: 7, humidity: 48 },
    { temp: 12, humidity: 60 },
    { temp: 4, humidity: 52 },
  ];

  for (let i = 0; i < temps1.length; i++) {
    const t = temps1[i];
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`reading-${Date.now()}-${i}`));
    const tx = await contractTrp.recordTemperature("VACCINE-001", t.temp * 10, t.humidity * 10, hash);
    await tx.wait();
    const violation = t.temp < 2 || t.temp > 8;
    console.log(`  📊 VACCINE-001: ${t.temp}°C, ${t.humidity}% ${violation ? "⚠️ VIOLATION" : "✅ OK"}`);
  }

  const temps2 = [
    { temp: -2, humidity: 40 },
    { temp: 0, humidity: 42 },
    { temp: 5, humidity: 38 },
    { temp: 8, humidity: 44 },
    { temp: 15, humidity: 55 },
  ];

  for (let i = 0; i < temps2.length; i++) {
    const t = temps2[i];
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`reading-${Date.now()}-${i}`));
    const tx = await contractTrp.recordTemperature("INSULIN-002", t.temp * 10, t.humidity * 10, hash);
    await tx.wait();
    const violation = t.temp < -5 || t.temp > 10;
    console.log(`  📊 INSULIN-002: ${t.temp}°C, ${t.humidity}% ${violation ? "⚠️ VIOLATION" : "✅ OK"}`);
  }

  console.log("\n=== Transferring Custody: Transporter → Warehouse ===\n");

  for (const s of shipments) {
    const tx = await contractTrp.transferCustody(s.id, warehouse.address);
    await tx.wait();
    console.log(`✅ ${s.id} → Warehouse`);
  }

  console.log("\n=== Recording Temperature Readings (Warehouse) ===\n");

  const temps3 = [
    { temp: 4, humidity: 40 },
    { temp: 5, humidity: 42 },
    { temp: 3, humidity: 38 },
  ];

  for (let i = 0; i < temps3.length; i++) {
    const t = temps3[i];
    const hash = ethers.keccak256(ethers.toUtf8Bytes(`reading-${Date.now()}-${i}`));
    const tx = await contractWhs.recordTemperature("BLOOD-003", t.temp * 10, t.humidity * 10, hash);
    await tx.wait();
    const violation = t.temp < 1 || t.temp > 6;
    console.log(`  📊 BLOOD-003: ${t.temp}°C, ${t.humidity}% ${violation ? "⚠️ VIOLATION" : "✅ OK"}`);
  }

  console.log("\n=== Transferring Custody: Warehouse → Distributor ===\n");

  const tx1 = await contractWhs.transferCustody("VACCINE-001", distributor.address);
  await tx1.wait();
  console.log("✅ VACCINE-001 → Distributor");

  const tx2 = await contractWhs.transferCustody("INSULIN-002", distributor.address);
  await tx2.wait();
  console.log("✅ INSULIN-002 → Distributor");

  console.log("\n=== Transferring Custody: Distributor → Hospital ===\n");

  const tx3 = await contractDst.transferCustody("VACCINE-001", hospital.address);
  await tx3.wait();
  console.log("✅ VACCINE-001 → Hospital");

  const tx4 = await contractDst.transferCustody("INSULIN-002", hospital.address);
  await tx4.wait();
  console.log("✅ INSULIN-002 → Hospital");

  console.log("\n=== Closing Shipment (Hospital) ===\n");

  const txClose = await contractHos.closeShipment("VACCINE-001");
  await txClose.wait();
  console.log("✅ VACCINE-001 closed by Hospital");

  console.log("\n=== Demo Data Summary ===\n");
  console.log("📦 3 Shipments created");
  console.log("🚚 Custody chain: Manufacturer → Transporter → Warehouse → Distributor → Hospital");
  console.log("📊 Temperature readings with some violations (12°C on VACCINE-001, 15°C on INSULIN-002)");
  console.log("🔒 VACCINE-001 closed");
  console.log("\nRefresh the frontend to see the data!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
