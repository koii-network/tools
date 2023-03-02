import { Common, arweave } from "./common";

export class Web extends Common {
  /**
   * Get Koii balance
   * @param address Address to check balance
   * @returns Balance
   */
  async getKoii(address: string): Promise<number> {
    this.assertArId(address);
    const state = await this.getKoiiState();
    return Object.prototype.hasOwnProperty.call(state.balances, address)
      ? state.balances[address]
      : 0;
  }

  /**
   * Get Arweave balance
   * @param address Address to check balance
   * @returns Balance
   */
  async getAr(address: string): Promise<number> {
    this.assertArId(address);
    const winston = await arweave.wallets.getBalance(address);
    const ar = arweave.ar.winstonToAr(winston);
    return parseFloat(ar);
  }

  /**
   * Get NFT states of address
   * @param address Address to lookup NFT states
   * @returns Array of address NFT states
   */
  async getNftsByOwner(address: string): Promise<Array<unknown>> {
    this.assertArId(address);

    // Get array of my awaitable NFT states
    const contentViewProms = [];
    for (const txId of await this.getNftIdsByOwner(address))
      contentViewProms.push(this.getNftState(txId));

    // Process NFTs simultaneously then return
    const getNftsRes = await Promise.allSettled(contentViewProms);
    return getNftsRes
      .filter((res) => res.status === "fulfilled")
      .map((res: any) => res.value);
  }

  /**
   * Get NFT states of loaded address
   * @returns Array of loaded address NFT states
   */
  async myContent(): Promise<Array<unknown>> {
    return this.getNftsByOwner(this.address as string);
  }
}

module.exports = { Web };
