import { ethers } from "ethers";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import hdkey from "ethereumjs-wallet/dist/hdkey";
import {
  ETHEREUM_DEFAULT_DERIVATION_PATH as wallet_hdpath,
  ImportMethod
} from "./constants";

export interface ProviderInformation {
  ethNetwork: string;
  apiKey: string;
}

export function clarifyEthereumProvider(
  ethProvider: string
): ProviderInformation | undefined {
  try {
    const providerArray = ethProvider.split("/");
    const apiKey = providerArray[4];
    const ethNetwork = providerArray[2].split(".")[0];
    return { ethNetwork, apiKey };
  } catch (err) {
    throw new Error("Failed to clarify Ethereum Provider");
  }
}

export class EthereumTool {
  provider: string;
  web3: ethers.providers.UrlJsonRpcProvider;
  key: string | null;
  address: string | null;

  constructor(provider: string) {
    this.provider = provider;
    const providerInformation = clarifyEthereumProvider(this.provider);

    if (!providerInformation) {
      throw new Error("Invalid ethereum provider");
    }

    const network = ethers.providers.getNetwork(providerInformation.ethNetwork);
    this.web3 = new ethers.providers.InfuraProvider(
      network,
      providerInformation.apiKey
    );

    this.key = null;
    this.address = null;
  }

  getWeb3(): ethers.providers.UrlJsonRpcProvider {
    return this.web3;
  }

  getCurrentNetWork(): string {
    return this.provider;
  }

  createNewWallet(): string {
    const seedPhrase = this.#generateMnemonic();
    const createdWallet = this.#getWalletFromSeedPhrase(seedPhrase);
    this.key = createdWallet.privateKey;
    this.address = createdWallet.address;
    return seedPhrase;
  }

  importWallet(payload: string, type: ImportMethod): ethers.Wallet {
    let wallet;
    if (type === "key") {
      wallet = new ethers.Wallet(payload, this.web3);
    } else {
      wallet = this.#getWalletFromSeedPhrase(payload);
    }
    this.key = wallet.privateKey;
    this.address = wallet.address;
    return wallet;
  }

  async getBalance(): Promise<ethers.BigNumber> {
    if (!this.address) {
      throw new Error("Cannot get the balance");
    }
    return this.web3.getBalance(this.address);
  }

  async transfer(
    recipient: string,
    qty: string,
    maxPriorityFeePerGas?: string,
    maxFeePerGas?: string
  ) {
    try {
      if (!this.key || !this.address)
        throw new Error("Key and address should not be null");

      // Initialize wallet from privateKey
      const wallet = new ethers.Wallet(this.key, this.web3);
      const signer = wallet.connect(this.web3);

      // Calculate gas
      if (!maxPriorityFeePerGas) maxPriorityFeePerGas = "2.5";
      const maxPriorityFeePerGasPayload = ethers.utils.parseUnits(
        maxPriorityFeePerGas,
        "gwei"
      );

      let maxFeePerGasPayload: ethers.BigNumber;
      if (!maxFeePerGas) {
        const result = await this.#calculateMaxFeePerGas(
          maxPriorityFeePerGasPayload
        );

        if (!result) throw new Error("Cannot calculate max fee per gas");

        maxFeePerGasPayload = result;
      } else {
        maxFeePerGasPayload = ethers.utils.parseUnits(maxFeePerGas, "gwei");
      }

      // Payload fields
      const nonce = await this.web3.getTransactionCount(
        this.address,
        "pending"
      );
      const chainId = (await this.web3.getNetwork()).chainId;
      /* type=0: Legacy transaction
         type=2: EIP1559 transaction
      */
      const type = 2;

      const transactionPayload: ethers.providers.TransactionRequest = {
        to: recipient,
        value: ethers.utils.parseEther(qty),
        maxPriorityFeePerGas: maxPriorityFeePerGasPayload,
        maxFeePerGas: maxFeePerGasPayload,
        nonce,
        chainId,
        type
      };

      const gasLimit = await signer.estimateGas(transactionPayload);
      transactionPayload.gasLimit = gasLimit || ethers.BigNumber.from("21000");

      // Sign transaction
      const rawTransaction = await signer.signTransaction(transactionPayload);
      const signedTransaction = ethers.utils.parseTransaction(rawTransaction);
      const txHash = signedTransaction?.hash;
      await this.web3.sendTransaction(rawTransaction);

      return txHash;
    } catch (err) {
      throw new Error(`Failed to transfer ETH: ${err}`);
    }
  }

  async getTransactionStatus(
    txHash: string
  ): Promise<ethers.providers.TransactionReceipt> {
    return this.web3.getTransactionReceipt(txHash);
  }

  /* PRIVATE FUNCTIONS */
  #getWalletFromSeedPhrase(seedPhrase: string) {
    const seed = mnemonicToSeedSync(seedPhrase);
    const hdwallet = hdkey.fromMasterSeed(seed);
    const wallet = hdwallet.derivePath(wallet_hdpath).getWallet();
    const privateKey = wallet.getPrivateKey().toString("hex");
    const restoredWallet = new ethers.Wallet(privateKey, this.web3);
    return restoredWallet;
  }

  #generateMnemonic(): string {
    return generateMnemonic();
  }

  async #calculateMaxFeePerGas(
    maxPriorityFeePerGasPayload: ethers.BigNumber
  ): Promise<ethers.BigNumber | undefined> {
    try {
      const baseFeePerGas = (await this.web3.getBlock("latest")).baseFeePerGas;

      if (!baseFeePerGas) throw new Error("Cannot get base fee per gas");

      return baseFeePerGas.mul(2).add(maxPriorityFeePerGasPayload);
    } catch (error) {
      throw new Error("Cannot calculate max fee per gas");
    }
  }
}
