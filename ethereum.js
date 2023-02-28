"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _EthereumTool_instances, _EthereumTool_getWalletFromSeedPhrase, _EthereumTool_generateMnemonic, _EthereumTool_calculateMaxFeePerGas;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthereumTool = exports.clarifyEthereumProvider = void 0;
const ethers_1 = require("ethers");
const bip39_1 = require("bip39");
const hdkey_1 = __importDefault(require("ethereumjs-wallet/dist/hdkey"));
const constants_1 = require("./constants");
function clarifyEthereumProvider(ethProvider) {
    try {
        const providerArray = ethProvider.split("/");
        const apiKey = providerArray[4];
        const ethNetwork = providerArray[2].split(".")[0];
        return { ethNetwork, apiKey };
    }
    catch (err) {
        throw new Error("Failed to clarify Ethereum Provider");
    }
}
exports.clarifyEthereumProvider = clarifyEthereumProvider;
class EthereumTool {
    constructor(provider) {
        _EthereumTool_instances.add(this);
        this.provider = provider;
        const providerInformation = clarifyEthereumProvider(this.provider);
        if (!providerInformation) {
            throw new Error("Invalid ethereum provider");
        }
        const network = ethers_1.ethers.providers.getNetwork(providerInformation.ethNetwork);
        this.web3 = new ethers_1.ethers.providers.InfuraProvider(network, providerInformation.apiKey);
        this.key = null;
        this.address = null;
    }
    getWeb3() {
        return this.web3;
    }
    getCurrentNetWork() {
        return this.provider;
    }
    createNewWallet() {
        const seedPhrase = __classPrivateFieldGet(this, _EthereumTool_instances, "m", _EthereumTool_generateMnemonic).call(this);
        const createdWallet = __classPrivateFieldGet(this, _EthereumTool_instances, "m", _EthereumTool_getWalletFromSeedPhrase).call(this, seedPhrase);
        this.key = createdWallet.privateKey;
        this.address = createdWallet.address;
        return seedPhrase;
    }
    importWallet(payload, type) {
        let wallet;
        if (type === "key") {
            wallet = new ethers_1.ethers.Wallet(payload, this.web3);
        }
        else {
            wallet = __classPrivateFieldGet(this, _EthereumTool_instances, "m", _EthereumTool_getWalletFromSeedPhrase).call(this, payload);
        }
        this.key = wallet.privateKey;
        this.address = wallet.address;
        return wallet;
    }
    async getBalance() {
        if (!this.address) {
            throw new Error("Cannot get the balance");
        }
        return this.web3.getBalance(this.address);
    }
    async transfer(recipient, qty, maxPriorityFeePerGas, maxFeePerGas) {
        try {
            if (!this.key || !this.address)
                throw new Error("Key and address should not be null");
            // Initialize wallet from privateKey
            const wallet = new ethers_1.ethers.Wallet(this.key, this.web3);
            const signer = wallet.connect(this.web3);
            // Calculate gas
            if (!maxPriorityFeePerGas)
                maxPriorityFeePerGas = "2.5";
            const maxPriorityFeePerGasPayload = ethers_1.ethers.utils.parseUnits(maxPriorityFeePerGas, "gwei");
            let maxFeePerGasPayload;
            if (!maxFeePerGas) {
                const result = await __classPrivateFieldGet(this, _EthereumTool_instances, "m", _EthereumTool_calculateMaxFeePerGas).call(this, maxPriorityFeePerGasPayload);
                if (!result)
                    throw new Error("Cannot calculate max fee per gas");
                maxFeePerGasPayload = result;
            }
            else {
                maxFeePerGasPayload = ethers_1.ethers.utils.parseUnits(maxFeePerGas, "gwei");
            }
            // Payload fields
            const nonce = await this.web3.getTransactionCount(this.address, "pending");
            const chainId = (await this.web3.getNetwork()).chainId;
            /* type=0: Legacy transaction
               type=2: EIP1559 transaction
            */
            const type = 2;
            const transactionPayload = {
                to: recipient,
                value: ethers_1.ethers.utils.parseEther(qty),
                maxPriorityFeePerGas: maxPriorityFeePerGasPayload,
                maxFeePerGas: maxFeePerGasPayload,
                nonce,
                chainId,
                type
            };
            const gasLimit = await signer.estimateGas(transactionPayload);
            transactionPayload.gasLimit = gasLimit || ethers_1.ethers.BigNumber.from("21000");
            // Sign transaction
            const rawTransaction = await signer.signTransaction(transactionPayload);
            const signedTransaction = ethers_1.ethers.utils.parseTransaction(rawTransaction);
            const txHash = signedTransaction?.hash;
            await this.web3.sendTransaction(rawTransaction);
            return txHash;
        }
        catch (err) {
            throw new Error(`Failed to transfer ETH: ${err}`);
        }
    }
    async getTransactionStatus(txHash) {
        return this.web3.getTransactionReceipt(txHash);
    }
}
exports.EthereumTool = EthereumTool;
_EthereumTool_instances = new WeakSet(), _EthereumTool_getWalletFromSeedPhrase = function _EthereumTool_getWalletFromSeedPhrase(seedPhrase) {
    const seed = (0, bip39_1.mnemonicToSeedSync)(seedPhrase);
    const hdwallet = hdkey_1.default.fromMasterSeed(seed);
    const wallet = hdwallet.derivePath(constants_1.ETHEREUM_DEFAULT_DERIVATION_PATH).getWallet();
    const privateKey = wallet.getPrivateKey().toString("hex");
    const restoredWallet = new ethers_1.ethers.Wallet(privateKey, this.web3);
    return restoredWallet;
}, _EthereumTool_generateMnemonic = function _EthereumTool_generateMnemonic() {
    return (0, bip39_1.generateMnemonic)();
}, _EthereumTool_calculateMaxFeePerGas = async function _EthereumTool_calculateMaxFeePerGas(maxPriorityFeePerGasPayload) {
    try {
        const baseFeePerGas = (await this.web3.getBlock("latest")).baseFeePerGas;
        if (!baseFeePerGas)
            throw new Error("Cannot get base fee per gas");
        return baseFeePerGas.mul(2).add(maxPriorityFeePerGasPayload);
    }
    catch (error) {
        throw new Error("Cannot calculate max fee per gas");
    }
};
//# sourceMappingURL=ethereum.js.map