describe("SwEth", () => {
    describe("reprice", () => {
        it("correctly reprices swEth for mints");
        it("reverts if paused");
        it("reverts if _swEthTotalSupply is 0");
        /** ... rest of reverts checks */
    });

    /** ... rest of external / public functions */
    describe("withdrawERC20", () => {
        it("correctly allows to withdraw");

        it("reverts when not called by PLATFORM_ADMIN");
        it("reverts when balance is 0");
        /** ... rest of reverts checks */
    });
});
