import { Common } from "./common";
export declare class Web extends Common {
    /**
     * Get Koii balance
     * @param address Address to check balance
     * @returns Balance
     */
    getKoii(address: string): Promise<number>;
    /**
     * Get Arweave balance
     * @param address Address to check balance
     * @returns Balance
     */
    getAr(address: string): Promise<number>;
    /**
     * Get NFT states of address
     * @param address Address to lookup NFT states
     * @returns Array of address NFT states
     */
    getNftsByOwner(address: string): Promise<Array<unknown>>;
    /**
     * Get NFT states of loaded address
     * @returns Array of loaded address NFT states
     */
    myContent(): Promise<Array<unknown>>;
}
