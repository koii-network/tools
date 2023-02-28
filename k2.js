"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.K2Tool = void 0;
const web3_js_1 = require("@_koi/web3.js");
const bip39_1 = require("bip39");
const bs58_1 = __importDefault(require("bs58"));
const ed25519_hd_key_1 = require("ed25519-hd-key");
const constants_1 = require("./constants");
class K2Tool {
    constructor(credentials, provider) {
        this.key = null;
        this.address = null;
        this.keypair = null;
        if (credentials) {
            this.key = credentials.key;
            this.address = credentials.address;
            this.keypair = web3_js_1.Keypair.fromSecretKey(new Uint8Array(credentials.key.split(",").map((value) => Number(value))));
        }
        if (!provider)
            provider = "testnet";
        this.provider = provider || "testnet";
        this.connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)(provider), "confirmed");
    }
    getCurrentNetwork() {
        return this.provider;
    }
    importWallet(key, type) {
        let keypair;
        /* Helper functions */
        const bufferToString = (buffer) => Buffer.from(buffer).toString("hex");
        const deriveSeed = (seed) => (0, ed25519_hd_key_1.derivePath)(constants_1.K2_DEFAULT_DERIVATION_PATH, seed).key;
        if (type === "seedphrase") {
            const seed = (0, bip39_1.mnemonicToSeedSync)(key);
            keypair = web3_js_1.Keypair.fromSeed(deriveSeed(bufferToString(seed)));
        }
        else {
            const secretKey = bs58_1.default.decode(key);
            keypair = web3_js_1.Keypair.fromSecretKey(secretKey);
        }
        this.keypair = keypair;
        this.address = keypair.publicKey.toString();
        this.key = keypair.secretKey.toString();
        const wallet = {
            address: this.address,
            privateKey: this.key
        };
        return wallet;
    }
    generateWallet() {
        const seedPhrase = (0, bip39_1.generateMnemonic)();
        this.importWallet(seedPhrase, "seedphrase");
        return seedPhrase;
    }
    async getBalance() {
        if (!this.keypair) {
            throw new Error("Cannot get the balance");
        }
        const balance = await this.connection.getBalance(this.keypair.publicKey);
        return balance;
    }
    async transfer(recipient, amount) {
        try {
            if (!this.keypair) {
                throw new Error("Keypair is currently null");
            }
            const transaction = new web3_js_1.Transaction();
            transaction.add(web3_js_1.SystemProgram.transfer({
                fromPubkey: this.keypair.publicKey,
                toPubkey: new web3_js_1.PublicKey(recipient),
                lamports: amount * web3_js_1.LAMPORTS_PER_SOL
            }));
            const receipt = await (0, web3_js_1.sendAndConfirmTransaction)(this.connection, transaction, [this.keypair]);
            return receipt;
        }
        catch (err) {
            if (err instanceof Error)
                throw new Error(err.message);
        }
    }
}
exports.K2Tool = K2Tool;
//# sourceMappingURL=k2.js.map