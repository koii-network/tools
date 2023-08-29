import {
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
import {
  K2Provider,
  K2_DEFAULT_DERIVATION_PATH as DEFAULT_DERIVE_PATH,
  ImportMethod
} from "./constants";

import { k2ClusterApiUrl as clusterApiUrl } from "./utils";

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
  provider: K2Provider;
  connection: Connection;

  constructor(credentials?: Credentials, provider?: K2Provider) {
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

  getCurrentNetwork(): K2Provider {
    return this.provider;
  }

  generateKoiiCliWallet(key: string) {
    try {
      const seed = mnemonicToSeedSync(key);
      const keypair = Keypair.fromSeed(
        Uint8Array.from(Uint8Array.from(seed)).slice(0, 32)
      );
      return keypair;
    } catch (err) {
      console.error("generateKoiiCliWallet", err);
      return null;
    }
  }

  async importWallet(key: string, type: ImportMethod): Promise<Wallet> {
    let keypair;

    /* Helper functions */
    const bufferToString = (buffer: Buffer) =>
      Buffer.from(buffer).toString("hex");

    const deriveSeed = (seed: string) =>
      derivePath(DEFAULT_DERIVE_PATH, seed).key;

    const keypairs = [];

    if (type === "seedphrase") {
      const seed = mnemonicToSeedSync(key);
      keypair = Keypair.fromSeed(deriveSeed(bufferToString(seed)));
      const koiiCliKeypair = this.generateKoiiCliWallet(key);
      keypairs.push(keypair);
      koiiCliKeypair && keypairs.push(koiiCliKeypair);
    } else {
      const secretKey = bs58.decode(key);
      keypair = Keypair.fromSecretKey(secretKey);
    }

    for (const kp of keypairs) {
      const balance = await this.connection.getBalance(kp.publicKey);
      if (balance > 0) {
        keypair = kp;
        break;
      }
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

  async generateWallet(): Promise<string> {
    const seedPhrase = generateMnemonic();
    await this.importWallet(seedPhrase, "seedphrase");
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
