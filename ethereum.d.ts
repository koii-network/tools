import { ethers } from "ethers";
import { ImportMethod } from "./constants";
export interface ProviderInformation {
    ethNetwork: string;
    apiKey: string;
}
export declare function clarifyEthereumProvider(ethProvider: string): ProviderInformation | undefined;
export declare class EthereumTool {
    #private;
    provider: string;
    web3: ethers.providers.UrlJsonRpcProvider;
    key: string | null;
    address: string | null;
    constructor(provider: string);
    getWeb3(): ethers.providers.UrlJsonRpcProvider;
    getCurrentNetWork(): string;
    createNewWallet(): string;
    importWallet(payload: string, type: ImportMethod): ethers.Wallet;
    getBalance(): Promise<ethers.BigNumber>;
    transfer(recipient: string, qty: string, maxPriorityFeePerGas?: string, maxFeePerGas?: string): Promise<string | undefined>;
    getTransactionStatus(txHash: string): Promise<ethers.providers.TransactionReceipt>;
}
