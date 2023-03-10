/* EXTERNAL MODULES */
import * as bip39 from "bip39";

import * as ethers from "ethers";
/* INTERNAL MODULES  */
import * as ethereum from "../src/ethereum";
// const ethereum = require("../dist/ethereum");

/* CONSTANTS */
const API_KEY = process.env.INFURA_API_KEY;
const ETH_NETWORK_PROVIDER = {
  MAINNET: `https://mainnet.infura.io/v3/${API_KEY}`,
  GOERLI: `https://goerli.infura.io/v3/${API_KEY}`
};
const SECRET_PHRASES =
  "cluster cram fish penalty twelve evoke because wheel close income bag pupil";
const WALLET_ADDRESS = "0x66083923D61D765f5FC51a612f17d64564358716";
const WALLET_KEY =
  "0x0ea98b5b46f3b452171da0e3bd335f6280205d2cc48b89d042c67cd25e1a2b56";

/* TESTCASES */
describe("EthereumTool class", () => {
  const mockedGetBalance = jest.fn().mockResolvedValue(42);
  const mockedGetTransactionReceipt = jest.fn().mockResolvedValue({});

  beforeAll(() => {
    jest.spyOn(bip39, "generateMnemonic").mockReturnValue(SECRET_PHRASES);

    ethers.providers.InfuraProvider.prototype.getBalance = mockedGetBalance;
    ethers.providers.InfuraProvider.prototype.getTransactionReceipt =
      mockedGetTransactionReceipt;
  });

  describe("getter web3 function", () => {
    it("should correctly return result with goerli provider", async () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      const web3 = ethTool.getWeb3();
      const { name, chainId } = await web3.getNetwork();

      expect(name).toBe("goerli");
      expect(chainId).toBe(5);
    });

    it("should correctly return result with mainnet provider", async () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.MAINNET);
      const web3 = ethTool.getWeb3();
      const { name, chainId } = await web3.getNetwork();

      expect(name).toBe("homestead");
      expect(chainId).toBe(1);
    });
  });

  describe("getter current network function", () => {
    it("should correctly return result with goerli provider", () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      const provider = ethTool.getCurrentNetWork();

      expect(provider).toBe(ETH_NETWORK_PROVIDER.GOERLI);
    });

    it("should correctly return result when mainnet provider", () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.MAINNET);
      const provider = ethTool.getCurrentNetWork();

      expect(provider).toBe(ETH_NETWORK_PROVIDER.MAINNET);
    });
  });

  describe("createNewWallet function", () => {
    it("should correctly return wallet with appropriate address", () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      const secretPhrase = ethTool.createNewWallet();

      expect(secretPhrase).toBe(SECRET_PHRASES);
      expect(ethTool.address).toBe(WALLET_ADDRESS);
      expect(ethTool.key).toBe(WALLET_KEY);
    });
  });

  describe("importWallet function", () => {
    it("should correctly return the wallet when import with private key", () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      const wallet = ethTool.importWallet(WALLET_KEY, "key");

      expect(ethTool.address).toBe(WALLET_ADDRESS);
      expect(ethTool.key).toBe(WALLET_KEY);

      expect(wallet.address).toBe(WALLET_ADDRESS);
      expect(wallet.privateKey).toBe(WALLET_KEY);
    });

    it("should correctly return the wallet when import with secret phrase", () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      const wallet = ethTool.importWallet(SECRET_PHRASES, "seedphrase");

      expect(ethTool.address).toBe(WALLET_ADDRESS);
      expect(ethTool.key).toBe(WALLET_KEY);

      expect(wallet.address).toBe(WALLET_ADDRESS);
      expect(wallet.privateKey).toBe(WALLET_KEY);
    });
  });

  describe("getBalance function", () => {
    it("should be called once with the correct parameter", async () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      ethTool.importWallet(SECRET_PHRASES, "seedphrase");
      const balance = await ethTool.getBalance();

      expect(mockedGetBalance).toBeCalledTimes(1);
      expect(mockedGetBalance).toBeCalledWith(WALLET_ADDRESS);
    });
  });

  describe("getTransactionStatus function ", () => {
    it("should be called once with the correct parameter", async () => {
      const ethTool = new ethereum.EthereumTool(ETH_NETWORK_PROVIDER.GOERLI);
      const txHash =
        "0x431dd7099dd206d79647eaf8680b026b51ecc1276f3c13b726d1ed86ff0775bf";
      const txReceipt = await ethTool.getTransactionStatus(txHash);

      expect(mockedGetTransactionReceipt).toBeCalledTimes(1);
      expect(mockedGetTransactionReceipt).toBeCalledWith(txHash);
    });
  });
});
