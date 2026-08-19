import { useCallback, useEffect, useState } from "react";
import "./App.css";
import type { ContractConfig } from "./types";
import { getConfig, getUser } from "./api";
import {
    connectWallet,
    getChainId,
    hasMetaMask,
    switchToColdChainNetwork,
    txErrorMessage,
    resetSignerCache
} from "./web3";
import AdminDashboard from "./components/AdminDashboard";
import ManufacturerDashboard from "./components/ManufacturerDashboard";
import TransporterDashboard from "./components/TransporterDashboard";
import WarehouseDashboard from "./components/WarehouseDashboard";
import DistributorDashboard from "./components/DistributorDashboard";
import HospitalDashboard from "./components/HospitalDashboard";
import { Loading } from "./components/ui";

function App() {

    const [wallet, setWallet] =
        useState("");

    const [role, setRole] =
        useState(0);

    const [roleLoading, setRoleLoading] =
        useState(false);

    const [chainId, setChainId] =
        useState<number | null>(null);

    const [config, setConfig] =
        useState<ContractConfig | null>(null);

    const [connectError, setConnectError] =
        useState("");

    const resolveRole = useCallback(
        async (address: string) => {

            setRoleLoading(true);

            try {

                const result =
                    await getUser(address);

                setRole(result.data.role);

            } catch {

                setRole(0);

            } finally {

                setRoleLoading(false);
            }
        },
        []
    );

    const handleAccountsChanged = useCallback(
        (...args: unknown[]) => {

            const accounts = args[0] as string[] | undefined;

            if (accounts && accounts.length > 0) {

                resetSignerCache();

                setWallet(accounts[0]);

                setRole(0);

                setRoleLoading(true);

                resolveRole(accounts[0]);
            } else {

                setWallet("");

                setRole(0);
            }
        },
        [resolveRole]
    );

    const handleChainChanged = useCallback(
        (...args: unknown[]) => {

            setChainId(Number(args[0]));
        },
        []
    );

    useEffect(() => {

        let mounted = true;

        getConfig()
            .then((result) => {

                if (mounted) {
                    setConfig(result.data);
                }
            })
            .catch(() => {
                // backend not running
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {

        const ethereum = window.ethereum;

        if (!ethereum) return;

        ethereum.on?.("accountsChanged", handleAccountsChanged);

        ethereum.on?.("chainChanged", handleChainChanged);

        return () => {

            ethereum.removeListener?.("accountsChanged", handleAccountsChanged);

            ethereum.removeListener?.("chainChanged", handleChainChanged);
        };
    }, [handleAccountsChanged, handleChainChanged]);

    const handleConnect = async () => {

        setConnectError("");

        if (!hasMetaMask()) {

            setConnectError(
                "MetaMask was not detected. Open this site in a browser with the MetaMask extension installed."
            );

            return;
        }

        try {

            const [account, chain] = await Promise.all([
                connectWallet(),
                getChainId()
            ]);

            setWallet(account);

            setChainId(chain);

            resolveRole(account);

        } catch (error) {

            setConnectError(txErrorMessage(error));
        }
    };

    const onSwitchNetwork = async () => {

        setConnectError("");

        try {

            await switchToColdChainNetwork();

            setChainId(await getChainId());

        } catch (error) {

            setConnectError(txErrorMessage(error));
        }
    };

    const onCorrectNetwork = async () => {

        setChainId(await getChainId());

        if (wallet) resolveRole(wallet);
    };

    // ============================================
    // RENDER
    // ============================================

    if (!wallet) {

        return (
            <div className="app landing">
                <div className="landing-hero">
                    <div className="landing-logo">❄️</div>
                    <h1>Blockchain Cold Chain Monitoring</h1>
                    <p>
                        Role-based pharmaceutical supply chain tracking built on
                        Ethereum. MetaMask is your identity — the smart contract
                        decides your role.
                    </p>
                    <button
                        className="btn-primary btn-large"
                        onClick={handleConnect}
                    >
                        🦊 Connect Wallet
                    </button>
                    {connectError && (
                        <p className="error-text">{connectError}</p>
                    )}
                </div>

                <div className="landing-roles">
                    <div className="role-chip">👑 Admin</div>
                    <div className="role-chip">🏭 Manufacturer</div>
                    <div className="role-chip">🚚 Transporter</div>
                    <div className="role-chip">🏢 Warehouse</div>
                    <div className="role-chip">📦 Distributor</div>
                    <div className="role-chip">🏥 Hospital</div>
                </div>

                <div className="landing-how">
                    <h2>How it works</h2>
                    <ol>
                        <li>Connect your MetaMask wallet.</li>
                        <li>The smart contract reads your blockchain role.</li>
                        <li>You are routed to the correct dashboard.</li>
                        <li>Every action is signed by your wallet.</li>
                    </ol>
                </div>
            </div>
        );
    }

    if (chainId !== null && chainId !== 1337) {

        return (
            <div className="app screen-center">
                <div className="screen-card">
                    <div className="screen-emoji">⚠️</div>
                    <h1>Unsupported Network</h1>
                    <p>
                        Please connect MetaMask to the Cold Chain network.
                    </p>
                    <p className="screen-meta">
                        <strong>Expected:</strong> {1337} (COLDCHAINNETWORK)
                    </p>
                    <p className="screen-meta">
                        <strong>Current Chain ID:</strong> {chainId}
                    </p>
                    <button
                        className="btn-primary"
                        onClick={onSwitchNetwork}
                    >
                        🔄 Switch to COLDCHAINNETWORK
                    </button>
                    {connectError && (
                        <p className="error-text">{connectError}</p>
                    )}
                </div>
            </div>
        );
    }

    if (roleLoading) {

        return (
            <div className="app screen-center">
                <Loading label="Detecting blockchain role…" />
            </div>
        );
    }

    if (role === 0) {

        return (
            <div className="app screen-center">
                <div className="screen-card">
                    <div className="screen-emoji">⛔</div>
                    <h1>Access Denied</h1>
                    <p>
                        Your wallet{" "}
                        <code className="inline">{wallet}</code>{" "}
                        is not registered in the Cold Chain system.
                    </p>
                    <p>
                        Please contact the administrator to be assigned a role.
                    </p>
                    <button
                        className="btn-ghost"
                        onClick={() => {
                            setWallet("");
                            setRole(0);
                        }}
                    >
                        ↩ Disconnect
                    </button>
                </div>
            </div>
        );
    }

    const switchAccountHint = (
        <div className="switch-hint">
            💡 In MetaMask, use "Switch Account" to try a different role.
            The dashboard updates automatically.
        </div>
    );

    if (role === 1) {

        return (
            <div className="app">
                <AdminDashboard key={wallet} wallet={wallet} config={config} />
                {switchAccountHint}
            </div>
        );
    }

    if (role === 2) {

        return (
            <div className="app">
                <ManufacturerDashboard key={wallet} wallet={wallet} config={config} />
                {switchAccountHint}
            </div>
        );
    }

    if (role === 3) {

        return (
            <div className="app">
                <TransporterDashboard key={wallet} wallet={wallet} config={config} />
                {switchAccountHint}
            </div>
        );
    }

    if (role === 4) {

        return (
            <div className="app">
                <WarehouseDashboard key={wallet} wallet={wallet} config={config} />
                {switchAccountHint}
            </div>
        );
    }

    if (role === 5) {

        return (
            <div className="app">
                <DistributorDashboard key={wallet} wallet={wallet} config={config} />
                {switchAccountHint}
            </div>
        );
    }

    if (role === 6) {

        return (
            <div className="app">
                <HospitalDashboard key={wallet} wallet={wallet} config={config} />
                {switchAccountHint}
            </div>
        );
    }

    return (
        <div className="app screen-center">
            <div className="screen-card">
                <h1>🤔 Unknown role</h1>
                <button
                    className="btn-primary"
                    onClick={onCorrectNetwork}
                >
                    Retry
                </button>
            </div>
        </div>
    );
}

export default App;
