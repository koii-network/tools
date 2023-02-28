"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SolanaTool_instances, _SolanaTool_getDerivePathList;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaTool = exports.clusterApiUrl = exports.endpoint = void 0;
const web3_js_1 = require("@solana/web3.js");
const ed25519_hd_key_1 = require("ed25519-hd-key");
const bip39_1 = require("bip39");
const bs58_1 = __importDefault(require("bs58"));
exports.endpoint = {
    http: {
        devnet: "http://api.devnet.solana.com",
        testnet: "http://api.testnet.solana.com",
        "mainnet-beta": "http://solana-mainnet.g.alchemy.com/v2/Ofyia5hQc-c-yfWwI4C9Qa0UcJ5lewDy"
    },
    https: {
        devnet: "https://api.devnet.solana.com",
        testnet: "https://api.testnet.solana.com",
        "mainnet-beta": "https://solana-mainnet.g.alchemy.com/v2/Ofyia5hQc-c-yfWwI4C9Qa0UcJ5lewDy"
    }
};
/**
 * Retrieves the RPC API URL for the specified cluster
 */
function clusterApiUrl(cluster, tls = true) {
    const key = tls === false ? "http" : "https";
    if (!cluster) {
        return exports.endpoint[key]["devnet"];
    }
    const url = exports.endpoint[key][cluster];
    if (!url) {
        throw new Error(`Unknown ${key} cluster: ${cluster}`);
    }
    return url;
}
exports.clusterApiUrl = clusterApiUrl;
class SolanaTool {
    constructor(credentials, provider) {
        _SolanaTool_instances.add(this);
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
        this.connection = new web3_js_1.Connection(clusterApiUrl(provider), "confirmed");
    }
    getCurrentNetwork() {
        return this.provider;
    }
    async importWallet(key, type) {
        let keypair;
        let seed;
        /* Constants */
        const DEFAULT_DERIVE_PATH = `m/44'/501'/0'/0'`; // from phantom
        const derivePathList = __classPrivateFieldGet(this, _SolanaTool_instances, "m", _SolanaTool_getDerivePathList).call(this);
        /* Helper functions */
        const bufferToString = (buffer) => Buffer.from(buffer).toString("hex");
        const deriveSeed = (seed) => (0, ed25519_hd_key_1.derivePath)(DEFAULT_DERIVE_PATH, seed).key;
        if (type === "seedphrase") {
            seed = (0, bip39_1.mnemonicToSeedSync)(key);
            keypair = web3_js_1.Keypair.fromSeed(deriveSeed(bufferToString(seed)));
            /*
              Pick first has balance address or first address
            */
            const connection = new web3_js_1.Connection(clusterApiUrl("mainnet-beta"), "confirmed");
            const balance = await connection.getBalance(keypair.publicKey);
            if (balance === 0) {
                for (const path of derivePathList) {
                    try {
                        const _keypair = web3_js_1.Keypair.fromSeed((0, ed25519_hd_key_1.derivePath)(path, bufferToString(seed)).key);
                        const _balance = await connection.getBalance(_keypair.publicKey);
                        if (_balance > 0) {
                            keypair = _keypair;
                            break;
                        }
                    }
                    catch (err) {
                        if (err instanceof Error)
                            throw new Error(err.message);
                    }
                }
            }
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
    async generateWallet() {
        const seedPhrase = (0, bip39_1.generateMnemonic)();
        await this.importWallet(seedPhrase, "seedphrase");
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
exports.SolanaTool = SolanaTool;
_SolanaTool_instances = new WeakSet(), _SolanaTool_getDerivePathList = function _SolanaTool_getDerivePathList() {
    const derivePathList = [];
    for (let i = 0; i < 20; i++) {
        const solanaPath = `m/44'/501'/${i}'/0'`;
        const solflarePath = `m/44'/501'/${i}'`;
        derivePathList.push(solanaPath);
        derivePathList.push(solflarePath);
    }
    return derivePathList;
};
//# sourceMappingURL=solana.js.map