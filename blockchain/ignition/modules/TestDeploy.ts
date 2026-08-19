import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestDeployModule = buildModule("TestDeployModule", (m) => {
  const test = m.contract("TestDeploy");

  return {
    test,
  };
});

export default TestDeployModule;