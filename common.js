"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Common = exports.arweave = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_fetch_adapter_1 = __importDefault(require("@vespaiach/axios-fetch-adapter"));
const arweave_1 = __importDefault(require("arweave"));
const smartweave_1 = __importDefault(require("smartweave"));
const arweaveUtils = __importStar(require("arweave/node/lib/utils"));
const web3_1 = __importDefault(require("web3"));
const contract_interact_1 = require("smartweave/lib/contract-interact");
//@ts-ignore // Needed to allow implicit unknown here
const human_crypto_keys_1 = require("human-crypto-keys");
//@ts-ignore
const pem_jwk_1 = require("pem-jwk");
const ethers_1 = require("ethers");
const BUNDLER_NODES = "/nodes";
const HOST_GATEWAY = "arweave.net";
const URL_ARWEAVE_INFO = `https://${HOST_GATEWAY}/info`;
const URL_ARWEAVE_GQL = `https://${HOST_GATEWAY}/graphql`;
const BLOCK_TEMPLATE = `
  pageInfo {
    hasNextPage
  }
  edges {
    cursor
    node {
      id anchor signature recipient
      owner { address key }
      fee { winston ar }
      quantity { winston ar }
      data { size type }
      tags { name value }
      block { id timestamp height previous }
      parent { id }
    }
  }`;
exports.arweave = arweave_1.default.init({
    host: HOST_GATEWAY,
    protocol: "https",
    port: 443,
    timeout: 10000,
    logging: false
});
/**
 * Tools for interacting with the koi network
 */
class Common {
    constructor(bundlerUrl = "https://mainnet.koii.live", contractId = "QA7AIFVx1KBBmzC7WUNhJbDsHlSJArUT0jWrhZMZPS8") {
        this.bundlerUrl = bundlerUrl;
        this.contractId = contractId;
        console.log("Initialized Koii Tools for true ownership and direct communication using version", this.contractId);
    }
    /**
     * Gets the current contract state
     * @returns Current KOI system state
     */
    async getKoiiState() {
        const response = await axios_1.default.get(this.bundlerUrl + "/state", {
            adapter: axios_fetch_adapter_1.default
        });
        if (response.data)
            return response.data;
    }
    /**
     * Gets the current contract state
     * @returns Current KOI system state
     */
    getContractState() {
        console.warn("getContractState is depreciated, use getKoiiState instead");
        return this.getKoiiState();
    }
    /**
     * Retrieves the a task state from the bundler
     * @param txId Transaction ID of the contract
     * @returns The contract state object
     */
    async getState(txId) {
        return (await axios_1.default.get(this.bundlerUrl + `/${txId}`, {
            adapter: axios_fetch_adapter_1.default
        })).data;
    }
    /**
     * Get the updated state of an NFT from a service node
     *   A NFT state is different from a regular state in the sense that an NFT state includes
     *   rewards and attention from an Attention state
     * @param id ID of the NFT to get
     * @returns State of an NFT including views and reward
     */
    async getNftState(id) {
        return (await axios_1.default.get(this.bundlerUrl + `/attention/nft?id=${id}`, {
            adapter: axios_fetch_adapter_1.default
        })).data;
    }
    /**
     * Depreciated wrapper for getNftState
     */
    contentView(id) {
        console.warn("contentView is depreciated, use getNftState instead");
        return this.getNftState(id);
    }
    /**
     * Depreciated wrapper for getNftState
     */
    readNftState(id) {
        console.warn("readNftState is depreciated, use getNftState instead");
        return this.getNftState(id);
    }
    /**
     * Wrapper for smartweaveReadContract
     *  This function is not recommended for use and should be avoided as smartweave readContract
     *  can be very slow
     * @param contractId contractId to be read
     * @returns state of the contract read
     */
    swReadContract(contractId) {
        return smartweave_1.default.readContract(exports.arweave, contractId);
    }
    /**
     * Gets the attention contract ID running on the bundler
     * @returns Attention contract ID running on the bundler as a string
     */
    async getAttentionId() {
        return (await axios_1.default.get(this.bundlerUrl + "/attention/id", {
            adapter: axios_fetch_adapter_1.default
        })).data;
    }
    /**
     * Generates wallet optionally with a mnemonic phrase
     * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
     */
    async generateWallet(use_mnemonic = false) {
        let key, mnemonic;
        if (use_mnemonic === true) {
            mnemonic = await this._generateMnemonic();
            key = await this._getKeyFromMnemonic(mnemonic);
        }
        else
            key = await exports.arweave.wallets.generate();
        if (!key)
            throw Error("failed to create wallet");
        this.mnemonic = mnemonic;
        this.wallet = key;
        await this.getWalletAddress();
        return true;
    }
    /**
     * Loads arweave wallet
     * @param source object to load from, JSON or JWK, or mnemonic key
     */
    async loadWallet(source) {
        switch (typeof source) {
            case "string":
                this.wallet = await this._getKeyFromMnemonic(source);
                break;
            default:
                this.wallet = source;
        }
        await this.getWalletAddress();
        return this.wallet;
    }
    /**
     * Manually set wallet address
     * @param walletAddress Address as a string
     * @returns Wallet address
     */
    setWallet(walletAddress) {
        if (!this.address)
            this.address = walletAddress;
        return this.address;
    }
    /**
     * Manually set any EVM compatible wallet address
     * @param walletAddress EVM compatible Address as a string
     * @param evmNetworkProvider EVM compatible Network Provider URL (For example https://mainnet.infura.io/v3/xxxxxxxxxxxxxxxxx in case of ethereum mainnet)
     * @returns Wallet address
     */
    initializeEvmWalletAndProvider(walletAddress, evmNetworkProvider) {
        if (!this.evmWalletAddress)
            this.evmWalletAddress = walletAddress;
        if (!evmNetworkProvider)
            throw Error("EVM compatible Network Provider not provided in parameter");
        this.web3 = new web3_1.default(evmNetworkProvider);
        return this.evmWalletAddress;
    }
    initializeEthWalletAndProvider(walletAddress, evmNetworkProvider) {
        if (!this.evmWalletAddress)
            this.evmWalletAddress = walletAddress;
        if (!evmNetworkProvider)
            throw Error("EVM compatible Network Provider not provided in parameter");
        const split = evmNetworkProvider.split("/");
        const apiKey = split[4];
        const networkName = split[2].split(".")[0];
        const network = ethers_1.ethers.providers.getNetwork(networkName);
        const provider = new ethers_1.ethers.providers.InfuraProvider(network, apiKey);
        this.web3 = provider;
        return this.evmWalletAddress;
    }
    /**
     * Gets EVM compatible wallet balance
     * @returns balance in EVM compatible currency
     */
    async getEvmWalletBalance() {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        const balance = await this.web3.eth.getBalance(this.evmWalletAddress);
        return this.web3.utils.fromWei(balance, "ether");
    }
    /**
     * Estimates the gas fees required for this particular tx
     * @param object A transaction object - see web3.eth.sendTransaction for detail
     * @returns The used gas for the simulated call/transaction.
     */
    async estimateGasEvm(object) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!object) {
            throw Error("EVM compatible private key not provided");
        }
        const gasPrice = await this.web3.eth.getGasPrice();
        const estimateGas = await this.web3.eth.estimateGas(object);
        const totalGasInWei = gasPrice * estimateGas;
        return this.web3.utils.fromWei(totalGasInWei.toString(), "ether");
    }
    async estimateGasEth(object) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!object) {
            throw Error("EVM compatible private key not provided");
        }
        const gasPrice = await this.web3.getGasPrice();
        const estimateGas = await this.web3.estimateGas(object);
        const totalGasInWei = gasPrice * estimateGas;
        return totalGasInWei;
    }
    /**
     * Estimates the gas fees required for this particular tx
     * @param toAddress The address whom to send the currency
     * @param amount The amount of currency to send
     * @param privateKey The privateKey for the sender wallet
     * @returns The receipt for the transaction
     */
    async transferEvm(toAddress, amount, privateKey) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!this.evmWalletAddress) {
            throw Error("EVM compatible Wallet Address is not set");
        }
        const amountToSend = this.web3.utils.toWei(amount.toString(), "ether"); // Convert to wei value
        const rawTx = {
            to: toAddress,
            value: amountToSend,
            gas: 0
        };
        const estimateGas = await this.web3.eth.estimateGas(rawTx);
        rawTx.gas = estimateGas;
        const signTx = await this.web3.eth.accounts.signTransaction(rawTx, privateKey);
        const receipt = await this.web3.eth.sendSignedTransaction(signTx.rawTransaction);
        return receipt;
    }
    async transferEth(toAddress, amount, privateKey) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!this.evmWalletAddress) {
            throw Error("EVM compatible Wallet Address is not set");
        }
        const amountToSend = amount * 1000000000000000000;
        const rawTx = {
            to: toAddress,
            value: amountToSend
        };
        const signer = new ethers_1.ethers.Wallet(privateKey, this.web3);
        const receipt = await signer.sendTransaction(rawTx);
        return receipt;
    }
    /**
     * signs payload from EVM compatible wallet
     * @param data The actual payload to be signed
     * @param evmPrivateKey EVM compatible Private Key as a string
     * @returns balance in ether
     */
    signPayloadEvm(data, evmPrivateKey) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!evmPrivateKey) {
            throw Error("EVM compatible private key not provided");
        }
        return this.web3.eth.accounts.sign(data, evmPrivateKey);
    }
    /**
     * creates EVM compatible wallet
     * @returns EVM compatible wallet
     */
    createEvmWallet() {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        const wallet = this.web3.eth.accounts.create(this.web3.utils.randomHex(32));
        return wallet;
    }
    /**
     * creates EVM compatible wallet
     * @param evmPrivateKey EVM compatible Private Key as a string
     * @returns EVM compatible wallet
     */
    getEvmWalletByPrivateKey(evmPrivateKey) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!evmPrivateKey) {
            throw Error("EVM compatible private key not provided");
        }
        const wallet = this.web3.eth.accounts.privateKeyToAccount(evmPrivateKey);
        return wallet;
    }
    /**
     * Gets all transactions for a particular EVM compatible wallet
     * @param APIKey APIKey to fetch the txs
     * @param network Specifies the network of txs to be fetched - Defaults to RINKEBY (RINKEBY, MAINNET, POLYGON or MUMBAI)
     * @param offset Number of transactions to return - Defaults to 50
     * @param walletAddress optional param, to fetch txs of other wallet address than the loaded one
     * @returns EVM compatible wallet
     */
    async getAllEvmTransactions(APIKey, network = "RINKEBY", offset = 50, walletAddress) {
        if (!this.web3) {
            throw Error("EVM compatible Wallet and Network not initialized");
        }
        if (!APIKey) {
            throw Error("APIKey not provided");
        }
        if (!walletAddress)
            walletAddress = this.evmWalletAddress || "";
        if (network == "POLYGON" || network == "MUMBAI") {
            try {
                const resp = await axios_1.default.get(`https://api${network == "MUMBAI" ? "-testnet" : ""}.polygonscan.com/api?module=account&action=txlist&address=${walletAddress}&startblock=1&endblock=99999999&page=1&offset=${offset}&sort=asc&apikey=${APIKey}`);
                return (resp.data && resp.data.result) || [];
            }
            catch (e) {
                console.error(e);
                return [];
            }
        }
        else {
            try {
                const resp = await axios_1.default.get(`https://api${network == "RINKEBY" ? "-rinkeby" : ""}.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=${offset}&sort=asc&apikey=${APIKey}`);
                return (resp.data && resp.data.result) || [];
            }
            catch (e) {
                console.error(e);
                return [];
            }
        }
    }
    /**
     * Uses koi wallet to get the address
     * @returns Wallet address
     */
    async getWalletAddress() {
        this.address = await exports.arweave.wallets.jwkToAddress(this.wallet);
        return this.address;
    }
    /**
     * Get and set arweave balance
     * @returns Balance as a string if wallet exists, else undefined
     */
    async getWalletBalance() {
        if (!this.address)
            return 0;
        const winston = await exports.arweave.wallets.getBalance(this.address);
        const ar = exports.arweave.ar.winstonToAr(winston);
        return parseFloat(ar);
    }
    /**
     * Gets koi balance from cache
     * @returns Balance as a number
     */
    async getKoiBalance() {
        const state = await this.getKoiiState();
        if (this.address !== undefined && this.address in state.balances)
            return state.balances[this.address];
        return 0;
    }
    /**
     * Get contract state
     * @param id Transaction ID
     * @returns State object
     */
    async getTransaction(id) {
        return exports.arweave.transactions.get(id);
    }
    /**
     * Get block height
     * @returns Block height maybe number
     */
    async getBlockHeight() {
        const info = await getArweaveNetInfo();
        return info.data.height;
    }
    /**
     * Interact with contract to stake
     * @param qty Quantity to stake
     * @returns Transaction ID
     */
    stake(qty) {
        if (!Number.isInteger(qty))
            throw Error('Invalid value for "qty". Must be an integer');
        const input = {
            function: "stake",
            qty: qty
        };
        return this.interactWrite(input);
    }
    /**
     * Interact with contract to withdraw
     * @param qty Quantity to transfer
     * @returns Transaction ID
     */
    withdraw(qty) {
        if (!Number.isInteger(qty))
            throw Error('Invalid value for "qty". Must be an integer');
        const input = {
            function: "withdraw",
            qty: qty
        };
        return this.interactWrite(input);
    }
    /**
     * Interact with contract to transfer koi
     * @param qty Quantity to transfer
     * @param target Receiver address
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    async transfer(qty, target, token, reward) {
        const input = {
            function: "transfer",
            qty: qty,
            target: target
        };
        switch (token) {
            case "AR": {
                const transaction = await exports.arweave.createTransaction({ target: target, quantity: exports.arweave.ar.arToWinston(qty.toString()) }, this.wallet);
                await exports.arweave.transactions.sign(transaction, this.wallet);
                await exports.arweave.transactions.post(transaction);
                return transaction.id;
            }
            case "KOI": {
                const txid = await this.interactWrite(input, this.contractId, reward);
                return txid;
            }
            default: {
                throw Error("token or coin ticker doesn't exist");
            }
        }
    }
    /**
     * Mint koi
     * @param arg object arg.targetAddress(receiver address) and arg.qty(amount to mint)
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    mint(arg, reward) {
        const input = {
            function: "mint",
            qty: arg.qty,
            target: arg.targetAddress
        };
        return this.interactWrite(input, this.contractId, reward);
    }
    /**
     * Transfer NFT ownership
     * @param nftId NFT ID to transfer
     * @param qty Quantity of NFT balance to transfer
     * @param target Target address to transfer ownership to
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    transferNft(nftId, qty, target, reward) {
        this.assertArId(nftId);
        if (!Number.isInteger(qty) || qty < 1)
            throw new Error("qty must be a positive integer");
        if (typeof target !== "string")
            throw new Error("target must be a string");
        const input = {
            function: "transfer",
            qty,
            target
        };
        return this.interactWrite(input, nftId, reward);
    }
    /**
     * Checks the validity of an Ar (transaction, address) ID
     *  TODO: check if arId is base64url compatible (only alphanumeric including -_ )
     * @param arId The Arweave ID to validate
     * @returns Validity of txId
     */
    validArId(arId) {
        return typeof arId === "string" && arId.length === 43;
    }
    /**
     * Throws an error if a Ar ID is invalid
     * @param arId The Arweave ID to assert
     */
    assertArId(arId) {
        if (!this.validArId(arId))
            throw new Error("Invalid arId");
    }
    /**
     * Call burn function in Koii contract
     * @param contractId Contract ID to preregister to, content will be migrated to this contract
     * @param contentType Description field to be interpreted by the migration contract
     * @param contentTxId Content TxID of the contract for preregistration
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    burnKoi(contractId, contentType, contentTxId, reward) {
        this.assertArId(contractId);
        const input = {
            function: "burnKoi",
            contractId,
            contentType,
            contentTxId
        };
        return this.interactWrite(input, this.contractId, reward);
    }
    /**
     * Call migration function in a contract
     * @param contractId Contract ID to migrate content to, defaults to attention contract
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    async migrate(contractId, reward) {
        contractId = contractId || (await this.getAttentionId());
        this.assertArId(contractId);
        const input = { function: "migratePreRegister" };
        return this.interactWrite(input, contractId, reward);
    }
    /**
     * Call syncOwnership function on attention contract
     * @param txId NFT id to be synchronized, can be an array if caller == attention contract owner
     * @param contractId Contract to call syncOwnership on, defaults to attention contract
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    async syncOwnership(txId, contractId, reward) {
        contractId = contractId || (await this.getAttentionId());
        this.assertArId(contractId);
        if (typeof txId === "string")
            this.assertArId(txId);
        else
            for (const id of txId)
                this.assertArId(id);
        const input = { function: "syncOwnership", txId };
        return this.interactWrite(input, contractId, reward);
    }
    /**
     * Simple wrapper for burnKoi for the attention contract
     * @param nftTxId ID of the NFT to be preregistered
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    async burnKoiAttention(nftTxId, reward) {
        this.assertArId(nftTxId);
        return this.burnKoi(await this.getAttentionId(), "nft", nftTxId, reward);
    }
    /**
     * Simple wrapper for migrate for the attention contract
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    async migrateAttention(reward) {
        return this.migrate(await this.getAttentionId(), reward);
    }
    /**
     * Call lockBounty function in Koii contract
     * @param contractId  Task contract ID registered in koii contract
     * @param bounty Bounty to be locked by task creator
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    lockBounty(contractId, bounty, reward) {
        this.assertArId(contractId);
        const input = {
            function: "lockBounty",
            contractId,
            bounty
        };
        return this.interactWrite(input, this.contractId, reward);
    }
    /**
     * Sign transaction
     * @param tx Transaction to be signed
     * @returns signed Transaction
     */
    async signTransaction(tx) {
        try {
            //const wallet = this.wallet;
            // Now we sign the transaction
            await exports.arweave.transactions.sign(tx, this.wallet);
            // After is signed, we send the transaction
            //await exports.arweave.transactions.post(transaction);
            return tx;
        }
        catch (err) {
            return null;
        }
    }
    /**
     * Get transaction data from Arweave
     * @param txId Transaction ID
     * @returns Transaction
     */
    nftTransactionData(txId) {
        return exports.arweave.transactions.get(txId);
    }
    /**
     * Sign payload
     * @param payload Payload to sign
     * @returns Signed payload with signature
     */
    async signPayload(payload) {
        if (this.wallet === undefined)
            return null;
        const data = payload.data || payload.vote || null;
        const jwk = this.wallet;
        const publicModulus = jwk.n;
        const dataInString = JSON.stringify(data);
        const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
        const rawSignature = await exports.arweave.crypto.sign(jwk, dataIn8Array);
        payload.signature = arweaveUtils.bufferTob64Url(rawSignature);
        payload.owner = publicModulus;
        return payload;
    }
    /**
     * Verify signed payload
     * @param payload
     * @returns Verification result
     */
    async verifySignature(payload) {
        const data = payload.data || payload.vote || null;
        const rawSignature = arweaveUtils.b64UrlToBuffer(payload.signature);
        const dataInString = JSON.stringify(data);
        const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
        return await exports.arweave.crypto.verify(payload.owner, dataIn8Array, rawSignature);
    }
    /**
     * Posts data to Arweave
     * @param data
     * @returns Transaction ID
     */
    async postData(data) {
        // TODO: define data interface
        const wallet = this.wallet;
        const transaction = await exports.arweave.createTransaction({
            data: Buffer.from(JSON.stringify(data, null, 2), "utf8")
        }, wallet);
        // Now we sign the transaction
        await exports.arweave.transactions.sign(transaction, wallet);
        const txId = transaction.id;
        // After is signed, we send the transaction
        const response = await exports.arweave.transactions.post(transaction);
        if (response.status === 200)
            return txId;
        return null;
    }
    /**
     * Gets all the transactions where the wallet is the owner
     * @param wallet Wallet address as a string
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns Object with transaction IDs as keys, and transaction data strings as values
     */
    getOwnedTxs(wallet, count, cursorId) {
        const countStr = count !== undefined ? `, first: ${count}` : "";
        const afterStr = cursorId !== undefined ? `, after: "${cursorId}"` : "";
        const query = `
      query {
        transactions(owners:["${wallet}"]${countStr}${afterStr}) {
          ${BLOCK_TEMPLATE}
        }
      }`;
        const request = JSON.stringify({ query });
        return this.gql(request);
    }
    /**
     * Gets all the transactions where the wallet is the recipient
     * @param wallet Wallet address as a string
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns Object with transaction IDs as keys, and transaction data strings as values
     */
    getRecipientTxs(wallet, count, cursorId) {
        const countStr = count !== undefined ? `, first: ${count}` : "";
        const afterStr = cursorId !== undefined ? `, after: "${cursorId}"` : "";
        const query = `
      query {
        transactions(recipients:["${wallet}"]${countStr}${afterStr}) {
          ${BLOCK_TEMPLATE}
        }
      }`;
        const request = JSON.stringify({ query });
        return this.gql(request);
    }
    /**
     *  Calculates total Views and earned KOII for given NFTIds Array
     * @param nftIdArr The array of NFTIds for which total Views and earned KOII will be calculated
     * @param attentionState The Koii state used to sum views and koii
     * @returns An object containing totalViews and totalRewards
     */
    async getViewsAndEarnedKOII(nftIdArr, attentionState) {
        attentionState = attentionState || (await this.getState("attention"));
        const attentionReport = attentionState.task.attentionReport;
        let totalViews = 0, totalReward = 0;
        for (const report of attentionReport) {
            let totalAttention = 0;
            for (const nftId in report) {
                totalAttention += report[nftId];
                if (nftIdArr.includes(nftId))
                    totalViews += report[nftId];
            }
            const rewardPerAttention = 1000 / totalAttention;
            for (const nftId of nftIdArr) {
                if (nftId in report)
                    totalReward += report[nftId] * rewardPerAttention;
            }
        }
        return { totalViews, totalReward };
    }
    /**
     *
     * Get a list of all NFT IDs
     * @returns Array of transaction IDs which are registered NFTs
     */
    async retrieveAllRegisteredContent() {
        const state = await this.getState("attention");
        return Object.keys(state.nfts);
    }
    /**
     *
     * Get the list of NFTs tagged as NSFW
     * @returns {Object} - returns a array of NFTs tagged as NSFW
     */
    async getNsfwNfts() {
        const query = `
      query {
        transactions(tags: [{
          name: "Action",
          values: ["marketplace/Create"]
        },
        {
          name: "NSFW",
          values: ["true"]
        }
      ]) {
          ${BLOCK_TEMPLATE}
        }
      }`;
        const request = JSON.stringify({ query });
        const gqlResp = await this.gql(request);
        if (gqlResp && gqlResp.data.transactions.edges) {
            return gqlResp.data.transactions.edges.map((e) => e.node ? e.node.id : "");
        }
        return { message: "No NSFW NFTs Found" };
    }
    /**
     * Get a list of NFT IDs by owner
     * @param owner Wallet address of the owner
     * @returns Array containing the NFTs
     */
    async getNftIdsByOwner(owner) {
        const attentionState = await this.getState("attention");
        const nftIds = [];
        for (const nftId in attentionState.nfts) {
            if (Object.prototype.hasOwnProperty.call(attentionState.nfts[nftId], owner))
                nftIds.push(nftId);
        }
        return nftIds;
    }
    /**
     * Get Koi rewards earned from an NFT
     * @param id The transaction id to process
     * @returns Koi rewards earned or null if the transaction is not a valid Koi NFT
     */
    async getNftReward(id) {
        return (await this.getNftState(id)).reward;
    }
    /**
     * Query Arweave using GQL
     * @param request Query string
     * @returns Object containing the query results
     */
    async gql(request) {
        const { data } = await axios_1.default.post(URL_ARWEAVE_GQL, request, {
            headers: { "content-type": "application/json" },
            adapter: axios_fetch_adapter_1.default
        });
        return data;
    }
    /**
     * Gets an array of service nodes
     * @param url URL of the service node to retrieve the array from a known service node
     * @returns Array of service nodes
     */
    async getNodes(url = this.bundlerUrl) {
        const res = await axios_1.default.get(url + BUNDLER_NODES, { adapter: axios_fetch_adapter_1.default });
        try {
            return JSON.parse(res.data);
        }
        catch (_e) {
            return [];
        }
    }
    /**
     * Gets the list of all KIDs(DIDs)
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns {Array} - returns a Javascript Array of object with each object representing a single KID
     */
    async getAllKID(count, cursorId) {
        const countStr = count !== undefined ? `, first: ${count}` : "";
        const afterStr = cursorId !== undefined ? `, after: "${cursorId}"` : "";
        const query = `
    query {
      transactions(tags: {
        name: "Action",
        values: ["KID/Create"]
    }${countStr}${afterStr}) {
        ${BLOCK_TEMPLATE}
      }
    }`;
        const request = JSON.stringify({ query });
        const gqlResp = await this.gql(request);
        if (gqlResp && gqlResp.data.transactions.edges) {
            return gqlResp.data.transactions.edges;
        }
        return { message: "No KIDs Found" };
    }
    /**
     * Get the KID state for the particular walletAddress
     * @param walletAddress The wallet address for the person whose DID is to be found
     * @returns {Object} - returns a contract object having id which can be used to get the state
     */
    async getKIDByWalletAddress(walletAddress) {
        const query = `
      query {
        transactions(tags: [{
          name: "Action",
          values: ["KID/Create"]
      },
        {
          name: "Wallet-Address",
          values: ["${walletAddress}"]
      }
      ]) {
          ${BLOCK_TEMPLATE}
        }
      }`;
        const request = JSON.stringify({ query });
        const gqlResp = await this.gql(request);
        if (gqlResp && gqlResp.data.transactions.edges) {
            return gqlResp.data.transactions.edges;
        }
        return { message: "No KID Found for this address" };
    }
    /**
     * Creates a KID smartcontract on arweave
     * @param KIDObject - an object containing name, description, addresses and link
     * @param image - an object containing contentType and blobData
     * @returns {txId} - returns a txId in case of success and false in case of failure
     */
    async createKID(KIDObject, image) {
        const initialState = KIDObject;
        if (initialState &&
            initialState.addresses &&
            initialState.addresses.Arweave) {
            try {
                const tx = await exports.arweave.createTransaction({
                    data: image.blobData
                }, this.wallet);
                tx.addTag("Content-Type", image.contentType);
                tx.addTag("Network", "Koii");
                tx.addTag("Action", "KID/Create");
                tx.addTag("App-Name", "SmartWeaveContract");
                tx.addTag("App-Version", "0.1.0");
                tx.addTag("Contract-Src", "t2jB63nGIWYUTDy2b00JPzSDtx1GQRsmKUeHtvZu1_A");
                tx.addTag("Wallet-Address", initialState.addresses.Arweave);
                tx.addTag("Init-State", JSON.stringify(initialState));
                await exports.arweave.transactions.sign(tx, this.wallet);
                const uploader = await exports.arweave.transactions.getUploader(tx);
                while (!uploader.isComplete) {
                    await uploader.uploadChunk();
                    console.log(uploader.pctComplete + "% complete", uploader.uploadedChunks + "/" + uploader.totalChunks);
                }
                console.log("TX ID: ", tx.id);
                return tx.id;
            }
            catch (err) {
                console.log("create transaction error");
                console.log("err-transaction", err);
                return false;
            }
        }
        else {
            console.log("Arweave Address missing in addresses");
            return false;
        }
    }
    /**
     * Updates the state of a KID smartcontract on arweave
     * @param KIDObject - an object containing name, description, addresses and link
     * @param contractId - the contract Id for KID to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    async updateKID(KIDObject, contractId) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        const txId = await (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, {
            function: "updateKID",
            ...KIDObject
        });
        return txId;
    }
    /**
     * Creates a NFT Collection smartcontract on arweave
     * @param collectionObject - an object containing name, description, addresses and link
     * @returns {txId} - returns a txId in case of success and false in case of failure
     */
    async createCollection(collectionObject) {
        const initialState = collectionObject;
        if (!collectionObject.owner) {
            console.log("collectionObject doesn't contain an owner");
            return false;
        }
        try {
            const tx = await exports.arweave.createTransaction({
                data: Buffer.from(collectionObject.owner, "utf8")
            }, this.wallet);
            tx.addTag("Content-Type", "text/plain");
            tx.addTag("Network", "Koii");
            tx.addTag("Action", "Collection/Create");
            tx.addTag("App-Name", "SmartWeaveContract");
            tx.addTag("App-Version", "0.1.0");
            tx.addTag("Contract-Src", "NCepV_8bY831CMHK0LZQAQAVwZyNKLalmC36FlagLQE");
            tx.addTag("Wallet-Address", collectionObject.owner);
            tx.addTag("Init-State", JSON.stringify(initialState));
            await exports.arweave.transactions.sign(tx, this.wallet);
            const uploader = await exports.arweave.transactions.getUploader(tx);
            while (!uploader.isComplete) {
                await uploader.uploadChunk();
                console.log(uploader.pctComplete + "% complete", uploader.uploadedChunks + "/" + uploader.totalChunks);
            }
            console.log("TX ID: ", tx.id);
            return tx.id;
        }
        catch (err) {
            console.log("create transaction error");
            console.log("err-transaction", err);
            return false;
        }
    }
    /**
     * Gets the list of all Collections by walletAddress
     * @param walletAddress The wallet address for the person whose DID is to be found
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns {Array} - returns a Javascript Array of object with each object representing a Collection object (The collection object contains id which can be used in func readState to get actual state)
     */
    async getCollectionsByWalletAddress(walletAddress, count, cursorId) {
        const countStr = count !== undefined ? `, first: ${count}` : "";
        const afterStr = cursorId !== undefined ? `, after: "${cursorId}"` : "";
        const query = `
      query {
        transactions(tags: [{
          name: "Action",
          values: ["Collection/Create"]
      },
        {
          name: "Wallet-Address",
          values: ["${walletAddress}"]
      }
      ]${countStr}${afterStr}) {
          ${BLOCK_TEMPLATE}
        }
      }`;
        const request = JSON.stringify({ query });
        const gqlResp = await this.gql(request);
        if (gqlResp && gqlResp.data.transactions.edges) {
            return gqlResp.data.transactions.edges;
        }
        return { message: "No Collections found for this address" };
    }
    /**
     * Add new NFTs to the existing collection
     * @param nftId - The transaction id of the NFT to be added to the collection
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    addToCollection(nftId, contractId) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, {
            function: "addToCollection",
            nftId
        });
    }
    /**
     * Remove NFTs from the existing collection
     * @param index - The index of the NFT which is to be removed from the collection
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    removeFromCollection(index, contractId) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, {
            function: "removeFromCollection",
            index
        });
    }
    /**
     * Updates the view of the existing Collection
     * @param newView - The view you want to set for the collection to display (Initialized with 'default')
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updateView(newView, contractId) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, {
            function: "updateView",
            newView
        });
    }
    /**
     * Updates the index of the NFT which should be used as the preview for the collection
     * @param imageIndex - The index of the NFT which should be used as the preview for the collection
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updatePreviewImageIndex(imageIndex, contractId) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, {
            function: "updatePreviewImageIndex",
            imageIndex
        });
    }
    /**
     * Updates the array of NFTs from which the collection is composed of (Can be used to reorder the NFts in the collection also)
     * @param collection - The array of NFTs from which the collection is composed of.
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updateCollection(collection, contractId) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, {
            function: "updateCollection",
            collection
        });
    }
    /**
     * Writes to contract
     * @param input Passes to write function, in order to execute a contract function
     * @param contractId Contract to write to, defaults to Koii contract
     *  @param reward Custom reward for txs, if needed.
     * @returns Transaction ID
     */
    interactWrite(input, contractId = this.contractId, reward) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return (0, contract_interact_1.interactWrite)(exports.arweave, wallet, contractId, input, undefined, undefined, undefined, reward);
    }
    // Private functions
    /**
     * Generate a 12 word mnemonic for an Arweave key https://github.com/acolytec3/arweave-mnemonic-keys
     * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
     */
    async _generateMnemonic() {
        const keys = await (0, human_crypto_keys_1.generateKeyPair)({ id: "rsa", modulusLength: 4096 }, { privateKeyFormat: "pkcs1-pem" });
        return keys.mnemonic;
    }
    /**
     * Generates a JWK object representation of an Arweave key
     * @param mnemonic - a 12 word mnemonic represented as a string
     * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
     */
    async _getKeyFromMnemonic(mnemonic) {
        const keyPair = await (0, human_crypto_keys_1.getKeyPairFromMnemonic)(mnemonic, { id: "rsa", modulusLength: 4096 }, { privateKeyFormat: "pkcs1-pem" });
        //@ts-ignore Need to access private attribute
        const privateKey = (0, pem_jwk_1.pem2jwk)(keyPair.privateKey);
        delete privateKey.alg;
        delete privateKey.key_ops;
        return privateKey;
    }
}
exports.Common = Common;
/**
 * Get info from Arweave net
 * @returns Axios response with info
 */
function getArweaveNetInfo() {
    return axios_1.default.get(URL_ARWEAVE_INFO, {
        adapter: axios_fetch_adapter_1.default
    });
}
module.exports = {
    arweave: exports.arweave,
    Common
};
//# sourceMappingURL=common.js.map