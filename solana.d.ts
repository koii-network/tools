import { Connection, Keypair } from "@solana/web3.js";
export declare const endpoint: {
    http: {
        devnet: string;
        testnet: string;
        "mainnet-beta": string;
    };
    https: {
        devnet: string;
        testnet: string;
        "mainnet-beta": string;
    };
};
/**
 * Retrieves the RPC API URL for the specified cluster
 */
export declare function clusterApiUrl(cluster: "mainnet-beta" | "devnet" | "testnet", tls?: boolean): string;
export interface Credentials {
    key: string;
    address: string;
}
export interface Wallet {
    address: string;
    privateKey: string;
}
export declare class SolanaTool {
    #private;
    key: string | null;
    address: string | null;
    keypair: Keypair | null;
    provider: "mainnet-beta" | "devnet" | "testnet";
    connection: Connection;
    constructor(credentials: Credentials | undefined, provider: "mainnet-beta" | "devnet" | "testnet" | undefined);
    getCurrentNetwork(): "mainnet-beta" | "devnet" | "testnet";
    importWallet(key: string, type: "seedphrase" | "key"): Promise<Wallet>;
    generateWallet(): Promise<string>;
    getBalance(): Promise<number>;
    transfer(recipient: string, amount: number): Promise<string | undefined>;
}
