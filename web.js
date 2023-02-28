"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web = void 0;
const common_1 = require("./common");
class Web extends common_1.Common {
    /**
     * Get Koii balance
     * @param address Address to check balance
     * @returns Balance
     */
    async getKoii(address) {
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
    async getAr(address) {
        this.assertArId(address);
        const winston = await common_1.arweave.wallets.getBalance(address);
        const ar = common_1.arweave.ar.winstonToAr(winston);
        return parseFloat(ar);
    }
    /**
     * Get NFT states of address
     * @param address Address to lookup NFT states
     * @returns Array of address NFT states
     */
    async getNftsByOwner(address) {
        this.assertArId(address);
        // Get array of my awaitable NFT states
        const contentViewProms = [];
        for (const txId of await this.getNftIdsByOwner(address))
            contentViewProms.push(this.getNftState(txId));
        // Process NFTs simultaneously then return
        const getNftsRes = await Promise.allSettled(contentViewProms);
        return getNftsRes
            .filter((res) => res.status === "fulfilled")
            .map((res) => res.value);
    }
    /**
     * Get NFT states of loaded address
     * @returns Array of loaded address NFT states
     */
    async myContent() {
        return this.getNftsByOwner(this.address);
    }
}
exports.Web = Web;
module.exports = { Web };
//# sourceMappingURL=web.js.map