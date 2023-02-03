import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@_koi/web3.js";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";

export interface Credentials {
  key: string;
  address: string;
}

export interface Wallet {
  address: string;
  privateKey: string;
}

export class K2Tool {
  key: string | null;
  address: string | null;
  keypair: Keypair | null;
  provider: "mainnet-beta" | "devnet" | "testnet";
  connection: Connection;

  constructor(
    credentials: Credentials | undefined,
    provider: "mainnet-beta" | "devnet" | "testnet" | undefined
  ) {
    this.key = null;
    this.address = null;
    this.keypair = null;

    if (credentials) {
      this.key = credentials.key;
      this.address = credentials.address;
      this.keypair = Keypair.fromSecretKey(
        new Uint8Array(credentials.key.split(",").map((value) => Number(value)))
      );
    }

    if (!provider) provider = "testnet";
    this.provider = provider || "testnet";
    this.connection = new Connection(clusterApiUrl(provider), "confirmed");
  }

  getCurrentNetwork(): "mainnet-beta" | "devnet" | "testnet" {
    return this.provider;
  }

  importWallet(key: string, type: "seedphrase" | "key"): Wallet {
    let keypair;

    /* Constants */
    const DEFAULT_DERIVE_PATH = `m/44'/501'/0'`;

    /* Helper functions */
    const bufferToString = (buffer: Buffer) =>
      Buffer.from(buffer).toString("hex");

    const deriveSeed = (seed: string) =>
      derivePath(DEFAULT_DERIVE_PATH, seed).key;

    if (type === "seedphrase") {
      const seed = mnemonicToSeedSync(key);
      keypair = Keypair.fromSeed(deriveSeed(bufferToString(seed)));
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

  generateWallet(): string {
    const seedPhrase = generateMnemonic();
    this.importWallet(seedPhrase, "seedphrase");
    return seedPhrase;
  }

  async getBalance(): Promise<number> {
    if (!this.keypair) {
      throw new Error("Cannot get the balance");
    }

    const balance = await this.connection.getBalance(this.keypair.publicKey);
    return balance;
  }
  async transfer(
    recipient: string,
    amount: number
  ): Promise<string | undefined> {
    try {
      if (!this.keypair) {
        throw new Error("Keypair is currently null");
      }

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
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
    }
  }
}
