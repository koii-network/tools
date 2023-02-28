import { Connection, Keypair } from "@_koi/web3.js";
import { K2Provider, ImportMethod } from "./constants";
export interface Credentials {
    key: string;
    address: string;
}
export interface Wallet {
    address: string;
    privateKey: string;
}
export declare class K2Tool {
    key: string | null;
    address: string | null;
    keypair: Keypair | null;
    provider: K2Provider;
    connection: Connection;
    constructor(credentials: Credentials | undefined, provider: K2Provider | undefined);
    getCurrentNetwork(): K2Provider;
    importWallet(key: string, type: ImportMethod): Wallet;
    generateWallet(): string;
    getBalance(): Promise<number>;
    transfer(recipient: string, amount: number): Promise<string | undefined>;
}
