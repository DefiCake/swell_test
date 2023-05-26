import { deriveEth2ValidatorKeys, deriveKeyFromMnemonic } from "@chainsafe/bls-keygen";
import { ethers } from "hardhat";
import bls from "@chainsafe/bls/blst-native";

export function getEth2ValidatorKeys() {
    const mnemonic = ethers.utils.entropyToMnemonic(ethers.utils.randomBytes(32));
    const masterSecretKey = deriveKeyFromMnemonic(mnemonic);
    const validatorPrivateKeys = deriveEth2ValidatorKeys(masterSecretKey, 0);
    const validatorPublicKey = bls.SecretKey.fromBytes(validatorPrivateKeys.signing).toPublicKey();
    const message = new Uint8Array(32);
    const signature = bls.SecretKey.fromBytes(validatorPrivateKeys.signing).sign(message);

    return {
        mnemonic,
        masterSecretKey,
        validatorPrivateKeys,
        validatorPublicKey,
        signature,
    };
}
