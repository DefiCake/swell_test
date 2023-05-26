import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { generalFixture } from "./fixtures/general";
import { getEth2ValidatorKeys } from "./utils/getEth2ValidatorKeys";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("General flow - hapy path", () => {
    it("should allow to setup a validator", async () => {
        const { operator, deployer, alice, bot, depositContract, depositManager, swEth, nodeOperatorRegistry } =
            await loadFixture(generalFixture);

        // Register validator
        const { validatorPublicKey, signature } = getEth2ValidatorKeys();
        const depositRoot = await depositContract.get_deposit_root();
        await nodeOperatorRegistry.connect(deployer).addOperator("operator", operator.address, operator.address);
        await nodeOperatorRegistry
            .connect(operator)
            .addNewValidatorDetails([{ pubKey: validatorPublicKey.toBytes(), signature: signature.toBytes() }]);

        // Fund deposit manager with user eth
        await swEth.connect(alice).deposit({ value: ethers.utils.parseEther("32") });
        expect(await swEth.balanceOf(alice.address)).to.be.equal(ethers.utils.parseEther("32"));

        // Setup validator
        await depositManager.connect(bot).setupValidators([validatorPublicKey.toBytes()], depositRoot);
    });

    it("should correctly track swEth / eth rate", async () => {
        const { operator, deployer, alice, bob, bot, depositContract, depositManager, swEth, nodeOperatorRegistry } =
            await loadFixture(generalFixture);

        const initialDeposit = ethers.utils.parseEther("32");
        // Fund deposit manager with user eth
        await swEth.connect(alice).deposit({ value: initialDeposit });

        const aliceSwEthBalance = await swEth.balanceOf(alice.address);
        expect(aliceSwEthBalance).to.be.equal(initialDeposit);

        // Reprice swEth / eth rate: suppose we have received 6 ETH as rewards from staking
        const preRewardEthReserves = initialDeposit;
        const stakingRewards = ethers.utils.parseEther("6");
        const totalSupplyAtRewardTime = await swEth.totalSupply();
        await swEth.connect(bot).reprice(preRewardEthReserves, stakingRewards, totalSupplyAtRewardTime);

        const expectedSwEthToEthRate = ethers.utils.parseEther(`${(32 + 6) / 32}`);
        const actualSwEthToEthRate = await swEth.getRate();

        expect(expectedSwEthToEthRate).to.be.eq(actualSwEthToEthRate);
        // In case of fuzzification it might be better to use closeTo.
        // expect(expectedSwEthToEthRate).to.be.closeTo(actualSwEthToEthRate, expectedSwEthToEthRate.div(1000));

        // Since we now have an increased rate of swEth to eth, further mints should yield less swEth
        await swEth.connect(bob).deposit({ value: initialDeposit });
        const bobSwEthBalance = await swEth.balanceOf(bob.address);
        const expectedBobBalance = initialDeposit.mul(ethers.BigNumber.from(10).pow(18)).div(actualSwEthToEthRate);

        expect(bobSwEthBalance).to.be.lt(aliceSwEthBalance);

        // Not sure what could be the loss of precision with the @prb/math library types, thus
        // using closeTo rather than a strict equality check.
        expect(bobSwEthBalance).to.be.closeTo(expectedBobBalance, expectedBobBalance.div(1000));
    });
});
