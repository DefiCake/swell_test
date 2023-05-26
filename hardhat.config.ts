import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

if (!process.env.RPC_URL) throw new Error("Need to configure .env file with RPC_URL");

const RPC_URL = process.env.RPC_URL;

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.8.16",
            },
            {
                version: "0.6.11",
            },
        ],
    },
    networks: {
        hardhat: {
            forking: {
                url: RPC_URL,
                blockNumber: 17341017,
            },
            allowUnlimitedContractSize: true,
        },
    },
};

export default config;
