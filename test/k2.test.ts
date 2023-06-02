"use strict";

/* EXTERNAL MODULES */
import * as bip39 from "bip39";

import * as base58 from "bs58";

import * as koiWeb3 from "@_koi/web3.js";

/* INTERNAL MODULES */
import * as k2 from "../src/k2";
// const k2 = require("../dist/k2");

const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} = koiWeb3;

/* CONSTANTS */
enum K2_NETWORK_PROVIDER {
  MAINNET = "mainnet-beta",
  TESTNET = "testnet",
  DEVNET = "devnet"
}

const SECRET_PHRASES =
  "rent involve devote swap uniform zero improve firm domain ketchup giggle universe";

const WALLET_ADDRESS = {
  MAIN: "32Dz2b9UtGymREov4EzkBsn52E6UaXHRLeECwXxEzxJ7",
  SUB: "dqVhPCxfATqmpepxgoKxfqCEvUwhZhH6qxyzdAHwH2k"
};

const WALLET_KEY = {
  MAIN: "239,131,93,46,8,24,70,148,47,133,51,239,173,80,19,108,76,105,5,130,80,142,22,185,221,149,224,108,39,53,141,84,30,7,162,133,97,225,30,138,53,30,120,164,198,253,52,234,13,45,99,53,221,29,0,28,108,146,148,87,94,166,148,52",
  SUB: "209,240,196,92,81,133,30,77,68,182,234,132,38,240,5,198,80,88,52,168,46,108,166,6,112,112,254,169,204,112,73,255,9,111,190,9,88,31,43,104,77,230,154,48,200,138,120,8,232,207,158,81,214,114,150,198,73,161,197,163,173,46,152,53"
};

const WALLET_CREDENTIALS = {
  MAIN: {
    address: WALLET_ADDRESS.MAIN,
    key: WALLET_KEY.MAIN
  },
  SUB: {
    address: WALLET_ADDRESS.SUB,
    key: WALLET_KEY.SUB
  }
};

/* HELPER FUNCTIONS */
const fromStringKeyToBase58Key = (key: string) => {
  return base58.encode(
    new Uint8Array(key.split(",").map((value) => Number(value)))
  );
};

/* TESTCASES */
describe("K2Tool class", () => {
  beforeAll(() => {
    jest.spyOn(bip39, "generateMnemonic").mockReturnValue(SECRET_PHRASES);
  });

  describe("getCurrentNetwork function", () => {
    it("should return correct testnet provider", () => {
      const k2Tool = new k2.K2Tool(undefined, K2_NETWORK_PROVIDER.TESTNET);
      const provider = k2Tool.getCurrentNetwork();

      expect(provider).toBe(K2_NETWORK_PROVIDER.TESTNET);
    });
  });

  describe("importWallet function", () => {
    describe("importWallet with private key", () => {
      it("should correctly return the wallet when import with main private key", async () => {
        const k2Tool = new k2.K2Tool();
        const key = fromStringKeyToBase58Key(WALLET_KEY.MAIN);
        const wallet = await k2Tool.importWallet(key, "key");

        expect(k2Tool.address).toBe(WALLET_ADDRESS.MAIN);
        expect(k2Tool.key).toBe(WALLET_KEY.MAIN);

        expect(wallet.address).toBe(WALLET_ADDRESS.MAIN);
        expect(wallet.privateKey).toBe(WALLET_KEY.MAIN);
      });

      it("should correctly return the wallet when import with sub private key", async () => {
        const k2Tool = new k2.K2Tool(undefined);
        const key = fromStringKeyToBase58Key(WALLET_KEY.SUB);
        const wallet = await k2Tool.importWallet(key, "key");

        expect(k2Tool.address).toBe(WALLET_ADDRESS.SUB);
        expect(k2Tool.key).toBe(WALLET_KEY.SUB);

        expect(wallet.address).toBe(WALLET_ADDRESS.SUB);
        expect(wallet.privateKey).toBe(WALLET_KEY.SUB);
      });
    });

    describe("importWallet with secret phrase", () => {
      it("should import the first wallet", async () => {
        const k2Tool = new k2.K2Tool(undefined);
        const wallet = await k2Tool.importWallet(SECRET_PHRASES, "seedphrase");

        expect(k2Tool.address).toBe(WALLET_ADDRESS.MAIN);
        expect(k2Tool.key).toBe(WALLET_KEY.MAIN);

        expect(wallet.address).toBe(WALLET_ADDRESS.MAIN);
        expect(wallet.privateKey).toBe(WALLET_KEY.MAIN);
      });
    });

    describe("importWallet with existing credentials", () => {
      it("should replace the old credentials", async () => {
        const k2Tool = new k2.K2Tool(WALLET_CREDENTIALS.SUB);

        expect(k2Tool.address).toBe(WALLET_ADDRESS.SUB);
        expect(k2Tool.key).toBe(WALLET_KEY.SUB);

        const wallet = await k2Tool.importWallet(SECRET_PHRASES, "seedphrase");

        expect(k2Tool.address).toBe(WALLET_ADDRESS.MAIN);
        expect(k2Tool.key).toBe(WALLET_KEY.MAIN);

        expect(wallet.address).toBe(WALLET_ADDRESS.MAIN);
        expect(wallet.privateKey).toBe(WALLET_KEY.MAIN);
      });
    });
  });

  describe("generateWallet function", () => {
    it("should correctly generate and save the wallet information", async () => {
      const k2Tool = new k2.K2Tool(WALLET_CREDENTIALS.MAIN);
      const secretPhrase = await k2Tool.generateWallet();

      expect(secretPhrase).toBe(SECRET_PHRASES);
      expect(k2Tool.address).toBe(WALLET_ADDRESS.MAIN);
      expect(k2Tool.key).toBe(WALLET_KEY.MAIN);
    });
  });

  describe("getBalance function", () => {
    const mockedGetBalance = jest.fn().mockResolvedValue(1e9);

    beforeAll(() => {
      Connection.prototype.getBalance = mockedGetBalance;
    });

    it("should be called once with the correct parameter", async () => {
      const k2Tool = new k2.K2Tool(
        WALLET_CREDENTIALS.MAIN,
        K2_NETWORK_PROVIDER.TESTNET
      );
      const balance = await k2Tool.getBalance();

      expect(mockedGetBalance).toBeCalledTimes(1);
      expect(mockedGetBalance).toBeCalledWith(new PublicKey(k2Tool.address!));
    });
  });

  describe("transfer function", () => {
    const mockedSendAndConfirmTransaction = jest.fn().mockResolvedValue("");

    beforeAll(() => {
      jest.spyOn(koiWeb3, "sendAndConfirmTransaction");
      // @ts-ignore
      koiWeb3.sendAndConfirmTransaction = mockedSendAndConfirmTransaction;
    });

    it("should be called once with the correct parameter", async () => {
      const k2Tool = new k2.K2Tool(
        WALLET_CREDENTIALS.MAIN,
        K2_NETWORK_PROVIDER.TESTNET
      );
      const txReceipt = await k2Tool.transfer(WALLET_ADDRESS.SUB, 0.0001);

      const transactionParam = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(WALLET_ADDRESS.MAIN),
          toPubkey: new PublicKey(WALLET_ADDRESS.SUB),
          lamports: 0.0001 * LAMPORTS_PER_SOL
        })
      );

      expect(mockedSendAndConfirmTransaction).toBeCalledTimes(1);
      expect(mockedSendAndConfirmTransaction).toBeCalledWith(
        k2Tool.connection,
        transactionParam,
        [
          Keypair.fromSecretKey(
            base58.decode(fromStringKeyToBase58Key(WALLET_KEY.MAIN))
          )
        ]
      );
    });
  });
});
