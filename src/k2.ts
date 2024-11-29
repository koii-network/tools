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
  K2_DEFAULT_DERIVATION_PATH as DEFAULT_DERIVE_PATH,
  ImportMethod
} from "./constants";

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
  rpcUrl: string;
  connection: Connection;

  constructor(credentials?: Credentials, rpcUrl?: string) {
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

    if (!rpcUrl) rpcUrl = "https://testnet.koii.network";
    this.rpcUrl = rpcUrl;

    this.connection = new Connection(rpcUrl, "confirmed");
  }

  getCurrentNetwork(): string {
    return this.rpcUrl;
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

  async importAllPossibleWallets(key: string): Promise<
    {
      address: string;
      pathType: string;
    }[]
  > {
    const bufferToString = (buffer: Buffer) =>
      Buffer.from(buffer).toString("hex");

    const deriveSeed = (seed: string) =>
      derivePath(DEFAULT_DERIVE_PATH, seed).key;

    const wallets = [];

    const seed = mnemonicToSeedSync(key);
    const keypair = Keypair.fromSeed(deriveSeed(bufferToString(seed)));
    const koiiCliKeypair = this.generateKoiiCliWallet(key);
    wallets.push({
      address: keypair.publicKey.toBase58(),
      pathType: "default"
    });
    koiiCliKeypair &&
      wallets.push({
        address: koiiCliKeypair.publicKey.toBase58(),
        pathType: "cli"
      });

    return wallets;
  }

  async importWalletByDerivationPath(
    seedphrase: string,
    pathType: "default" | "cli"
  ) {
    let keypair;
    if (pathType === "default") {
      const bufferToString = (buffer: Buffer) =>
        Buffer.from(buffer).toString("hex");
      const deriveSeed = (seed: string) =>
        derivePath(DEFAULT_DERIVE_PATH, seed).key;
      const seed = mnemonicToSeedSync(seedphrase);
      keypair = Keypair.fromSeed(deriveSeed(bufferToString(seed)));
    } else if (pathType === "cli") {
      keypair = this.generateKoiiCliWallet(seedphrase);
    }

    if (!keypair) {
      throw new Error("Keypair is currently null");
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
