import { ethers } from "ethers";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import hdkey from "ethereumjs-wallet/dist/hdkey";

const clarifyEthereumProvider = (ethProvider: string) => {
  try {
    const providerArray = ethProvider.split("/");
    const apiKey = providerArray[4];
    const ethNetwork = providerArray[2].split(".")[0];
    return { ethNetwork, apiKey };
  } catch (err: any) {
    console.error("Failed to clarify Ethereum Provider - error: ", err.message);
    return {
      ethNetwork: "mainnet",
      apiKey: "f811f2257c4a4cceba5ab9044a1f03d2"
    };
  }
};

export class EthereumTool {
  provider: string;
  web3: any;
  key: any;
  address: any;

  constructor(provider: string) {
    this.provider = provider;

    const { ethNetwork, apiKey } = clarifyEthereumProvider(this.provider);
    const network = ethers.providers.getNetwork(ethNetwork);
    this.web3 = new ethers.providers.InfuraProvider(network, apiKey);

    this.key = null;
    this.address = null;
  }

  getWeb3() {
    return this.web3;
  }

  getCurrentNetWork() {
    return this.provider;
  }

  createNewWallet() {
    const seedPhrase = this.#generateMnemonic();

    const createdWallet = this.#getWalletFromSeedPhrase(seedPhrase);
    this.key = createdWallet.privateKey;
    this.address = createdWallet.address;
    return seedPhrase;
  }

  importWallet(payload: any, type: any) {
    let wallet;
    if (type === "key") {
      // wallet = this.#web3.eth.accounts.privateKeyToAccount(payload)
      wallet = new ethers.Wallet(payload, this.web3);
    } else {
      wallet = this.#getWalletFromSeedPhrase(payload);
    }
    this.key = wallet.privateKey;
    this.address = wallet.address;

    return wallet;
  }

  async getBalance() {
    return this.web3.getBalance(this.address);
  }

  async transferEth(toAddress: string, amount: number) {
    // TODO MinhVu
  }

  async getTransactionStatus(txHash: string) {
    // return this.#web3.eth.getTransactionReceipt(txHash)
    return this.web3.getTransactionReceipt(txHash);
  }

  /*
    PRIVATE FUNCTIONS
  */
  #getWalletFromSeedPhrase(seedPhrase: string) {
    const seed = mnemonicToSeedSync(seedPhrase);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const wallet_hdpath = "m/44'/60'/0'/0/0";

    const wallet = hdwallet.derivePath(wallet_hdpath).getWallet();
    const address = "0x" + wallet.getAddress().toString("hex");

    const privateKey = wallet.getPrivateKey().toString("hex");
    // const restoredWallet = this.#web3.eth.accounts.privateKeyToAccount(privateKey)
    const restoredWallet = new ethers.Wallet(privateKey, this.web3);

    return restoredWallet;
  }

  #generateMnemonic() {
    return generateMnemonic();
  }
}
