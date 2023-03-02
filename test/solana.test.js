"use strict";

/* EXTERNAL MODULES */
const bip39 = require("bip39");
const base58 = require("bs58");
const solanaWeb3 = require("@solana/web3.js");
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} = solanaWeb3;

/* INTERNAL MODULES */
const solana = require("../src/solana");
// const solana = require("../dist/solana");

/* CONSTANTS */
const SOL_NETWORK_PROVIDER = {
  MAINNET: "mainnet-beta",
  TESTNET: "testnet",
  DEVNET: "devnet"
};

const SECRET_PHRASES =
  "neglect trigger better derive lawsuit erosion cry online private rib vehicle drop";

const WALLET_ADDRESS = {
  MAIN: "9cGCJvVacp5V6xjeshprS3KDN3e5VwEUszHmxxaZuHmJ",
  SUB: "5f6r16czBTinZiNdW7TnDHLWS2Hvt3eAyqZWyWQhur7j"
};

const WALLET_KEY = {
  MAIN: "87,188,51,212,151,148,184,219,43,102,46,41,168,214,110,209,155,62,127,172,14,227,236,91,171,173,50,227,150,219,250,23,127,230,1,55,81,44,74,245,8,176,126,27,127,163,91,47,95,19,138,193,152,131,194,141,43,198,128,40,77,16,1,73",
  SUB: "198,5,157,173,48,253,15,5,119,7,41,27,252,169,165,190,24,129,196,37,113,187,191,172,230,172,221,90,135,0,71,0,69,49,109,96,73,35,196,99,141,237,132,184,222,79,76,22,199,153,39,2,164,51,237,174,243,134,18,50,7,153,127,170"
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

const ENDPOINT = {
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

/* HELPER FUNCTIONS */
const fromStringKeyToBase58Key = (key) => {
  return base58.encode(
    new Uint8Array(key.split(",").map((value) => Number(value)))
  );
};

/* TESTCASES */
describe("SolanaTool class", () => {
  beforeAll(() => {
    jest.spyOn(bip39, "generateMnemonic").mockReturnValue(SECRET_PHRASES);
  });

  describe("getter current network function", () => {
    it("should return correct mainnet provider", () => {
      const solTool = new solana.SolanaTool(null, SOL_NETWORK_PROVIDER.MAINNET);
      const provider = solTool.getCurrentNetwork();

      expect(provider).toBe(SOL_NETWORK_PROVIDER.MAINNET);
    });

    it("should return correct devnet provider", () => {
      const solTool = new solana.SolanaTool(null, SOL_NETWORK_PROVIDER.DEVNET);
      const provider = solTool.getCurrentNetwork();

      expect(provider).toBe(SOL_NETWORK_PROVIDER.DEVNET);
    });

    it("should return correct testnet provider", () => {
      const solTool = new solana.SolanaTool(null, SOL_NETWORK_PROVIDER.TESTNET);
      const provider = solTool.getCurrentNetwork();

      expect(provider).toBe(SOL_NETWORK_PROVIDER.TESTNET);
    });
  });

  describe("importWallet function", () => {
    describe("importWallet with private key", () => {
      it("should correctly return the wallet when import with main private key", async () => {
        const solTool = new solana.SolanaTool(null);
        const key = fromStringKeyToBase58Key(WALLET_KEY.MAIN);
        const wallet = await solTool.importWallet(key, "key");

        expect(solTool.address).toBe(WALLET_ADDRESS.MAIN);
        expect(solTool.key).toBe(WALLET_KEY.MAIN);

        expect(wallet.address).toBe(WALLET_ADDRESS.MAIN);
        expect(wallet.privateKey).toBe(WALLET_KEY.MAIN);
      });

      it("should correctly return the wallet when import with sub private key", async () => {
        const solTool = new solana.SolanaTool(null);
        const key = fromStringKeyToBase58Key(WALLET_KEY.SUB);
        const wallet = await solTool.importWallet(key, "key");

        expect(solTool.address).toBe(WALLET_ADDRESS.SUB);
        expect(solTool.key).toBe(WALLET_KEY.SUB);

        expect(wallet.address).toBe(WALLET_ADDRESS.SUB);
        expect(wallet.privateKey).toBe(WALLET_KEY.SUB);
      });
    });

    describe("importWallet with secret phrase", () => {
      it("should import the first wallet", async () => {
        const mockedGetBalance = jest.fn().mockResolvedValue(1e9);
        Connection.prototype.getBalance = mockedGetBalance;

        const solTool = new solana.SolanaTool(null);
        const wallet = await solTool.importWallet(SECRET_PHRASES, "seedphrase");

        expect(solTool.address).toBe(WALLET_ADDRESS.MAIN);
        expect(solTool.key).toBe(WALLET_KEY.MAIN);

        expect(wallet.address).toBe(WALLET_ADDRESS.MAIN);
        expect(wallet.privateKey).toBe(WALLET_KEY.MAIN);
      });

      it("should import the wallet with the balance larger than 0", async () => {
        const mockedGetBalance = jest
          .fn()
          .mockImplementation(async (publicKey) => {
            if (publicKey.toBase58() !== WALLET_ADDRESS.SUB)
              return Promise.resolve(0);
            return Promise.resolve(1e9);
          });
        Connection.prototype.getBalance = mockedGetBalance;

        const solTool = new solana.SolanaTool(null);
        const wallet = await solTool.importWallet(SECRET_PHRASES, "seedphrase");

        expect(solTool.address).toBe(WALLET_ADDRESS.SUB);
        expect(solTool.key).toBe(WALLET_KEY.SUB);

        expect(wallet.address).toBe(WALLET_ADDRESS.SUB);
        expect(wallet.privateKey).toBe(WALLET_KEY.SUB);
      });
    });

    describe("importWallet with existing credentials", () => {
      it("should replace the old credentials", async () => {
        const mockedGetBalance = jest.fn().mockResolvedValue(1e9);
        Connection.prototype.getBalance = mockedGetBalance;

        const solTool = new solana.SolanaTool(WALLET_CREDENTIALS.SUB);

        expect(solTool.address).toBe(WALLET_ADDRESS.SUB);
        expect(solTool.key).toBe(WALLET_KEY.SUB);

        const wallet = await solTool.importWallet(SECRET_PHRASES, "seedphrase");

        expect(solTool.address).toBe(WALLET_ADDRESS.MAIN);
        expect(solTool.key).toBe(WALLET_KEY.MAIN);

        expect(wallet.address).toBe(WALLET_ADDRESS.MAIN);
        expect(wallet.privateKey).toBe(WALLET_KEY.MAIN);
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });
  });

  describe("generateWallet function", () => {
    it("should correctly generate and save the wallet information", async () => {
      const solTool = new solana.SolanaTool(WALLET_CREDENTIALS.SUB);
      const secretPhrase = await solTool.generateWallet();

      expect(secretPhrase).toBe(SECRET_PHRASES);
      expect(solTool.address).toBe(WALLET_ADDRESS.MAIN);
      expect(solTool.key).toBe(WALLET_KEY.MAIN);
    });
  });

  describe("getBalance function", () => {
    const mockedGetBalance = jest.fn().mockResolvedValue(1e9);

    beforeAll(() => {
      Connection.prototype.getBalance = mockedGetBalance;
    });

    it("should be called once with the correct parameter", async () => {
      const solTool = new solana.SolanaTool(
        WALLET_CREDENTIALS.MAIN,
        SOL_NETWORK_PROVIDER.DEVNET
      );
      const balance = await solTool.getBalance();

      expect(mockedGetBalance).toBeCalledTimes(1);
      expect(mockedGetBalance).toBeCalledWith(new PublicKey(solTool.address));
    });
  });

  describe("transfer function", () => {
    const mockedSendAndConfirmTransaction = jest.fn().mockResolvedValue("");

    beforeAll(() => {
      jest.spyOn(solanaWeb3, "sendAndConfirmTransaction");
      solanaWeb3.sendAndConfirmTransaction = mockedSendAndConfirmTransaction;
    });

    it("should be called once with the correct parameter", async () => {
      const solTool = new solana.SolanaTool(
        WALLET_CREDENTIALS.MAIN,
        SOL_NETWORK_PROVIDER.DEVNET
      );
      const txReceipt = await solTool.transfer(WALLET_ADDRESS.SUB, 0.0001);

      const transactionParam = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(WALLET_ADDRESS.MAIN),
          toPubkey: new PublicKey(WALLET_ADDRESS.SUB),
          lamports: 0.0001 * LAMPORTS_PER_SOL
        })
      );

      expect(mockedSendAndConfirmTransaction).toBeCalledTimes(1);
      expect(mockedSendAndConfirmTransaction).toBeCalledWith(
        solTool.connection,
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

describe("clusterApiUrl function", () => {
  it("should correctly return URL when passing cluster and tls", () => {
    const url = solana.clusterApiUrl("mainnet-beta", true);
    expect(url).toBe(ENDPOINT.https["mainnet-beta"]);
  });

  it("should correctly return URL when cluster parameter is undefined", () => {
    const url = solana.clusterApiUrl(undefined, false);
    expect(url).toBe(ENDPOINT.http["devnet"]);
  });

  it("should correctly return URL when cluster parameter is null", () => {
    const url = solana.clusterApiUrl(null, true);
    expect(url).toBe(ENDPOINT.https["devnet"]);
  });

  it("should correctly return URL when tls parameter is missing", () => {
    const url = solana.clusterApiUrl("testnet");
    expect(url).toBe(ENDPOINT.https["testnet"]);
  });

  it("should return correctly URL when missing all the parameter", () => {
    const url = solana.clusterApiUrl();
    expect(url).toBe(ENDPOINT.https["devnet"]);
  });

  it("should throw error when the URL cannot be found", () => {
    expect(() => solana.clusterApiUrl("mainnet", true)).toThrow(
      `Unknown https cluster: mainnet`
    );
  });
});
