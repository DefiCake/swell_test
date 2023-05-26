import { ethers, upgrades } from "hardhat";

import {
    AccessControlManager,
    IDepositContract__factory,
    DepositManager,
    NodeOperatorRegistry,
    SwETH,
} from "../../typechain-types";
import { ETH_DEPOSIT_CONTRACT_ADDRESS, SWELL_LIB_BOT_ROLE, SWETH_MIN_REPRICE_TIME } from "./constants";

export async function generalFixture() {
    const signers = await ethers.getSigners();
    const [deployer, admin, swellTreasury, bot, operator, alice, bob, carol] = signers;

    // // Deploy DepositContract
    // const DepositContract = await ethers.getContractFactory("DepositContract")
    // const depositContract = await DepositContract.deploy();
    // await depositContract.deployed()
    // await network.provider.send("hardhat_setCode", [ETH_DEPOSIT_CONTRACT_ADDRESS, ETH_DEPOSIT_CONTRACT_BYTECODE]);
    const depositContract = IDepositContract__factory.connect(ETH_DEPOSIT_CONTRACT_ADDRESS, ethers.provider);

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    const accessControlManager = (
        await upgrades.deployProxy(AccessControlManager, [
            { admin: admin.address, swellTreasury: swellTreasury.address },
        ])
    ).connect(deployer) as AccessControlManager;
    await accessControlManager.deployed();

    // Deploy NodeOperatorRegistry
    const NodeOperatorRegistry = await ethers.getContractFactory("NodeOperatorRegistry");
    const nodeOperatorRegistry = (await upgrades.deployProxy(NodeOperatorRegistry, [
        accessControlManager.address,
    ])) as NodeOperatorRegistry;
    await nodeOperatorRegistry.deployed();

    // Deploy DepositManager
    const DepositManager = await ethers.getContractFactory("DepositManager");
    const depositManager = (await upgrades.deployProxy(DepositManager, [
        accessControlManager.address,
    ])) as DepositManager;

    // Deploy swETH
    const SwEth = await ethers.getContractFactory("swETH");
    const swEth = (await upgrades.deployProxy(SwEth, [accessControlManager.address])).connect(deployer) as SwETH;

    // Configure contracts
    await accessControlManager.setDepositManager(depositManager.address);
    await accessControlManager.setNodeOperatorRegistry(nodeOperatorRegistry.address);
    await accessControlManager.grantRole(SWELL_LIB_BOT_ROLE, bot.address);
    await accessControlManager.unpauseBotMethods();
    await accessControlManager.unpauseCoreMethods();
    await accessControlManager.unpauseOperatorMethods();
    await accessControlManager.unpauseWithdrawals();

    await swEth.addToWhitelist(alice.address);
    await swEth.addToWhitelist(bob.address);
    await swEth.addToWhitelist(carol.address);
    await swEth.setMinimumRepriceTime(SWETH_MIN_REPRICE_TIME);

    return {
        signers,
        deployer,
        admin,
        swellTreasury,
        bot,
        operator,
        alice,
        bob,
        carol,
        depositContract,
        accessControlManager,
        nodeOperatorRegistry,
        depositManager,
        swEth,
    };
}
