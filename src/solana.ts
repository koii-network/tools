import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import bs58 from "bs58";

export const endpoint = {
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
export function clusterApiUrl(
  cluster: "mainnet-beta" | "devnet" | "testnet",
  tls = true
) {
  const key = tls === false ? "http" : "https";

  if (!cluster) {
    return endpoint[key]["devnet"];
  }

  const url: string = endpoint[key][cluster];

  if (!url) {
    throw new Error(`Unknown ${key} cluster: ${cluster}`);
  }

  return url;
}

export interface Credentials {
  key: string;
  address: string;
}

export interface Wallet {
  address: string;
  privateKey: string;
}
export class SolanaTool {
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

  async importWallet(key: string, type: "seedphrase" | "key"): Promise<Wallet> {
    let keypair;
    let seed;

    /* Constants */
    const DEFAULT_DERIVE_PATH = `m/44'/501'/0'/0'`; // from phantom
    const derivePathList = this.#getDerivePathList();

    /* Helper functions */
    const bufferToString = (buffer: Buffer) =>
      Buffer.from(buffer).toString("hex");

    const deriveSeed = (seed: string) =>
      derivePath(DEFAULT_DERIVE_PATH, seed).key;

    if (type === "seedphrase") {
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
          } catch (err) {
            if (err instanceof Error) throw new Error(err.message);
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

  #getDerivePathList(): string[] {
    const derivePathList = [];
    for (let i = 0; i < 20; i++) {
      const solanaPath = `m/44'/501'/${i}'/0'`;
      const solflarePath = `m/44'/501'/${i}'`;
      derivePathList.push(solanaPath);
      derivePathList.push(solflarePath);
    }
    return derivePathList;
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
