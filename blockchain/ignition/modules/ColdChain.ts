import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ColdChainModule = buildModule("ColdChainModule", (m) => {
  const coldChain = m.contract("ColdChain");

  return {
    coldChain,
  };
});

export default ColdChainModule;