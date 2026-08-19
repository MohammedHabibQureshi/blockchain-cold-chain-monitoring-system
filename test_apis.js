const { exec } = require("child_process");
const http = require("http");

// Start the backend server
console.log("Starting backend server...");
const serverProcess = exec("cd D:\\projects\\Blockchain-Cold-Chain-Monitoring\\backend && set GANACHE_RPC_URL=http://127.0.0.1:7545 && node src/server.ts", (error, stdout, stderr) => {
    console.log("Server output:", stdout.substring(0, 500));
    console.log("Server error:", stderr.substring(0, 500));
    
    // Wait for server to start
    setTimeout(testApis, 5000);
});

function testApis() {
    const tests = [
        { path: "/api/health", expected: "success" },
        { path: "/api/config", expected: "success" },
        { path: "/api/users", expected: "success" },
        { path: "/api/shipments", expected: "success" },
    ];
    
    let completed = 0;
    
    tests.forEach(test => {
        const req = http.get(`http://localhost:3001${test.path}`, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                console.log(`${test.path}:`, data);
                completed++;
                if (completed === tests.length) {
                    serverProcess.kill();
                }
            });
        });
        req.on("error", (e) => {
            console.log(`${test.path}: Error - ${e.message}`);
            completed++;
            if (completed === tests.length) {
                serverProcess.kill();
            }
        });
    });
    
    setTimeout(() => {
        console.log("Timeout - testing complete");
        serverProcess.kill();
    }, 10000);
}