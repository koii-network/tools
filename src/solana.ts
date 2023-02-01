import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import isEmpty from "lodash/isEmpty";
import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";

const endpoint = {
  http: {
    devnet: "http://api.devnet.solana.com",
    testnet: "http://api.testnet.solana.com",
    "mainnet-beta":
      "http://solana-mainnet.g.alchemy.com/v2/Ofyia5hQc-c-yfWwI4C9Qa0UcJ5lewDy"
  },
  https: {
    devnet: "https://api.devnet.solana.com",
    testnet: "https://api.testnet.solana.com",
    "mainnet-beta":
      "https://solana-mainnet.g.alchemy.com/v2/Ofyia5hQc-c-yfWwI4C9Qa0UcJ5lewDy"
  }
};

/**
 * Retrieves the RPC API URL for the specified cluster
 */
export default function clusterApiUrl(cluster: any, tls?: any) {
  const key = tls === false ? "http" : "https";

  if (!cluster) {
    return endpoint[key]["devnet"];
  }

  const url = endpoint[key][cluster];

  if (!url) {
    throw new Error(`Unknown ${key} cluster: ${cluster}`);
  }

  return url;
}

export class SolanaTool {
  key: any;
  address: any;
  keypair: any;
  provider: any;
  connection: any;

  constructor(credentials: any, provider: any) {
    this.key = null;
    this.address = null;
    this.keypair = null;

    if (!isEmpty(credentials)) {
      this.key = credentials.key;
      this.address = credentials.address;
      this.keypair = Keypair.fromSecretKey(
        new Uint8Array(credentials.key.split(","))
      );
    }

    this.provider = provider || "testnet";
    this.connection = new Connection(clusterApiUrl(provider), "confirmed");
  }

  getCurrentNetwork() {
    return this.provider;
  }

  async importWallet(key: any, type: any) {
    let keypair;
    let seed;

    const bufferToString = (buffer: any) => Buffer.from(buffer).toString("hex");
    const DEFAULT_DERIVE_PATH = `m/44'/501'/0'/0'`; // from phantom

    const derivePathList = this.#getDerivePathList();

    if (type === "seedphrase") {
      const deriveSeed = (seed: any) =>
        derivePath(DEFAULT_DERIVE_PATH, seed).key;

      seed = mnemonicToSeedSync(key);
      keypair = Keypair.fromSeed(deriveSeed(bufferToString(seed)));

      /* 
        Pick first has balance address or first address
      */
      const connection = new Connection(
        clusterApiUrl("mainnet-beta"),
        "confirmed"
      );
      const balance = await connection.getBalance(keypair.publicKey);

      if (balance === 0) {
        for (const path of derivePathList) {
          try {
            const _keypair = Keypair.fromSeed(
              derivePath(path, bufferToString(seed)).key
            );
            const _balance = await connection.getBalance(_keypair.publicKey);
            if (_balance > 0) {
              keypair = _keypair;
              break;
            }
          } catch (err: any) {
            console.error("ERROR: ", err.message);
          }
        }
      }
    } else {
      const secretKey = bs58.decode(key);
      keypair = Keypair.fromSecretKey(secretKey);
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

  #getDerivePathList() {
    const derivePathList = [];

    for (let i = 0; i < 20; i++) {
      const solanaPath = `m/44'/501'/${i}'/0'`;
      const solflarePath = `m/44'/501'/${i}'`;

      derivePathList.push(solanaPath);
      derivePathList.push(solflarePath);
    }

    return derivePathList;
  }

  async generateWallet() {
    const seedPhrase = generateMnemonic();

    await this.importWallet(seedPhrase, "seedphrase");

    return seedPhrase;
  }

  async getBalance() {
    const balance = await this.connection.getBalance(this.keypair.publicKey);

    return balance;
  }

  async transfer(recipient: any, amount: any) {
    const transaction = new Transaction();

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: new PublicKey(recipient),
        lamports: amount * LAMPORTS_PER_SOL
      })
    );

    const receipt = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair]
    );

    return receipt;
  }
}
