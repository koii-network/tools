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
import { isEmpty } from "lodash";

export class K2Tool {
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

  importSeedphrase(seedphrase: any) {
    /* Utilities */
    const bufferToString = (buffer: any) => Buffer.from(buffer).toString("hex");
    const deriveSeed = (seed: any) => derivePath(DERIVE_PATH, seed).key;

    /* Import 100 wallets from seedphrase and DERIVE_PATH */
    const keypairs = [];
    for (let i = 0; i < 100; i++) {
      const DERIVE_PATH = `m/44'/501'/${i}'/0'`;

      const seed = mnemonicToSeedSync(seedphrase);
      keypair = Keypair.fromSeed(deriveSeed(DERIVE_PATH, bufferToString(seed)));

      keypairs.push(keypair);
    }

    return keypairs;
  }

  importWallet(key: any, type: any) {
    let keypair;

    if (type === "seedphrase") {
      const DEFAULT_DERIVE_PATH = `m/44'/501'/0'`;

      const bufferToString = (buffer: any) =>
        Buffer.from(buffer).toString("hex");
      const deriveSeed = (seed: any) =>
        derivePath(DEFAULT_DERIVE_PATH, seed).key;

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
