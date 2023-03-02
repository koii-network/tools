import axios, { AxiosResponse } from "axios";
import axiosAdapter from "@vespaiach/axios-fetch-adapter";
import Arweave from "arweave";
import smartweave from "smartweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import * as arweaveUtils from "arweave/node/lib/utils";
import Transaction from "arweave/node/lib/transaction";

import { interactWrite } from "smartweave/lib/contract-interact";
//@ts-ignore // Needed to allow implicit unknown here
import { generateKeyPair, getKeyPairFromMnemonic } from "human-crypto-keys";
//@ts-ignore
import { pem2jwk } from "pem-jwk";

import { ethers } from "ethers";

export interface BundlerPayload {
  data?: unknown;
  signature?: string; // Data signed with private key
  owner?: string; // Public modulus, can be used to verifiably derive address
  senderAddress?: string; //@deprecated // Use owner instead
  vote?: Vote; //@deprecated // Use data instead
}

export interface Vote {
  voteId: number;
  direct?: string;
}

export interface RegistrationData {
  url: string;
  timestamp: number;
}

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

export const arweave = Arweave.init({
  host: HOST_GATEWAY,
  protocol: "https",
  port: 443,
  timeout: 10000, // Set timeout to 10000 to prevent denial of service attacks, causes Out of Memory error if too high
  logging: false
});

/**
 * Tools for interacting with the koi network
 */
export class Common {
  wallet?: JWKInterface;
  mnemonic?: string;
  address?: string;
  contractId: string;
  bundlerUrl: string;
  web3?: any;
  evmWalletAddress?: string;

  constructor(
    bundlerUrl = "https://mainnet.koii.live",
    contractId = "QA7AIFVx1KBBmzC7WUNhJbDsHlSJArUT0jWrhZMZPS8"
  ) {
    this.bundlerUrl = bundlerUrl;
    this.contractId = contractId;
    console.log(
      "Initialized Koii Tools for true ownership and direct communication using version",
      this.contractId
    );
  }

  /**
   * Gets the current contract state
   * @returns Current KOI system state
   */
  async getKoiiState(): Promise<any> {
    const response = await axios.get(this.bundlerUrl + "/state", {
      adapter: axiosAdapter
    });
    if (response.data) return response.data;
  }

  /**
   * Gets the current contract state
   * @returns Current KOI system state
   */
  getContractState(): Promise<unknown> {
    console.warn("getContractState is depreciated, use getKoiiState instead");
    return this.getKoiiState();
  }

  /**
   * Retrieves the a task state from the bundler
   * @param txId Transaction ID of the contract
   * @returns The contract state object
   */
  async getState(txId: string): Promise<any> {
    return (
      await axios.get(this.bundlerUrl + `/${txId}`, {
        adapter: axiosAdapter
      })
    ).data;
  }

  /**
   * Get the updated state of an NFT from a service node
   *   A NFT state is different from a regular state in the sense that an NFT state includes
   *   rewards and attention from an Attention state
   * @param id ID of the NFT to get
   * @returns State of an NFT including views and reward
   */
  async getNftState(id: string): Promise<any> {
    return (
      await axios.get(this.bundlerUrl + `/attention/nft?id=${id}`, {
        adapter: axiosAdapter
      })
    ).data;
  }

  /**
   * Depreciated wrapper for getNftState
   */
  contentView(id: string): Promise<unknown> {
    console.warn("contentView is depreciated, use getNftState instead");
    return this.getNftState(id);
  }

  /**
   * Depreciated wrapper for getNftState
   */
  readNftState(id: string): Promise<unknown> {
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
  swReadContract(contractId: string): Promise<unknown> {
    return smartweave.readContract(arweave, contractId);
  }

  /**
   * Gets the attention contract ID running on the bundler
   * @returns Attention contract ID running on the bundler as a string
   */
  async getAttentionId(): Promise<string> {
    return (
      await axios.get(this.bundlerUrl + "/attention/id", {
        adapter: axiosAdapter
      })
    ).data as string;
  }

  /**
   * Generates wallet optionally with a mnemonic phrase
   * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
   */
  async generateWallet(use_mnemonic = false): Promise<Error | true> {
    let key: JWKInterface, mnemonic: string | undefined;
    if (use_mnemonic === true) {
      mnemonic = await this._generateMnemonic();
      key = await this._getKeyFromMnemonic(mnemonic);
    } else key = await arweave.wallets.generate();

    if (!key) throw Error("failed to create wallet");

    this.mnemonic = mnemonic;
    this.wallet = key;
    await this.getWalletAddress();
    return true;
  }

  /**
   * Loads arweave wallet
   * @param source object to load from, JSON or JWK, or mnemonic key
   */
  async loadWallet(source: unknown): Promise<JWKInterface> {
    switch (typeof source) {
      case "string":
        this.wallet = await this._getKeyFromMnemonic(source);
        break;
      default:
        this.wallet = source as JWKInterface;
    }

    await this.getWalletAddress();
    return this.wallet;
  }

  /**
   * Manually set wallet address
   * @param walletAddress Address as a string
   * @returns Wallet address
   */
  setWallet(walletAddress: string): string {
    if (!this.address) this.address = walletAddress;
    return this.address;
  }

  /**
   * Manually set any EVM compatible wallet address
   * @param walletAddress EVM compatible Address as a string
   * @param evmNetworkProvider EVM compatible Network Provider URL (For example https://mainnet.infura.io/v3/xxxxxxxxxxxxxxxxx in case of ethereum mainnet)
   * @returns Wallet address
   */
  initializeEthWalletAndProvider(
    walletAddress: string,
    evmNetworkProvider: string
  ): string {
    if (!this.evmWalletAddress) this.evmWalletAddress = walletAddress;
    if (!evmNetworkProvider)
      throw Error("EVM compatible Network Provider not provided in parameter");

    const split = evmNetworkProvider.split("/");
    const apiKey = split[4];
    const networkName = split[2].split(".")[0];

    const network = ethers.providers.getNetwork(networkName);

    const provider = new ethers.providers.InfuraProvider(network, apiKey);

    this.web3 = provider;

    return this.evmWalletAddress;
  }

  /**
   * Estimates the gas fees required for this particular tx
   * @param object A transaction object - see web3.eth.sendTransaction for detail
   * @returns The used gas for the simulated call/transaction.
   */
  async estimateGasEth(object: unknown): Promise<number> {
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
  async transferEth(
    toAddress: string,
    amount: number,
    privateKey: string
  ): Promise<unknown> {
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

    const signer = new ethers.Wallet(privateKey, this.web3);

    const receipt = await signer.sendTransaction(rawTx);
    return receipt;
  }

  /**
   * Uses koi wallet to get the address
   * @returns Wallet address
   */
  async getWalletAddress(): Promise<string> {
    this.address = await arweave.wallets.jwkToAddress(this.wallet);
    return this.address;
  }

  /**
   * Get and set arweave balance
   * @returns Balance as a string if wallet exists, else undefined
   */
  async getWalletBalance(): Promise<number> {
    if (!this.address) return 0;
    const winston = await arweave.wallets.getBalance(this.address);
    const ar = arweave.ar.winstonToAr(winston);
    return parseFloat(ar);
  }

  /**
   * Gets koi balance from cache
   * @returns Balance as a number
   */
  async getKoiBalance(): Promise<number> {
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
  async getTransaction(id: string): Promise<Transaction> {
    return arweave.transactions.get(id);
  }

  /**
   * Get block height
   * @returns Block height maybe number
   */
  async getBlockHeight(): Promise<unknown> {
    const info = await getArweaveNetInfo();
    return info.data.height;
  }

  /**
   * Interact with contract to stake
   * @param qty Quantity to stake
   * @returns Transaction ID
   */
  stake(qty: number): Promise<string> {
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
  withdraw(qty: number): Promise<string> {
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
  async transfer(
    qty: number,
    target: string,
    token: string,
    reward?: string
  ): Promise<string> {
    const input = {
      function: "transfer",
      qty: qty,
      target: target
    };
    switch (token) {
      case "AR": {
        const transaction = await arweave.createTransaction(
          { target: target, quantity: arweave.ar.arToWinston(qty.toString()) },
          this.wallet
        );
        await arweave.transactions.sign(transaction, this.wallet);
        await arweave.transactions.post(transaction);
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
  mint(arg: any, reward?: string): Promise<string> {
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
  transferNft(
    nftId: string,
    qty: number,
    target: string,
    reward?: string
  ): Promise<string> {
    this.assertArId(nftId);
    if (!Number.isInteger(qty) || qty < 1)
      throw new Error("qty must be a positive integer");
    if (typeof target !== "string") throw new Error("target must be a string");

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
  validArId(arId: any): boolean {
    return typeof arId === "string" && arId.length === 43;
  }

  /**
   * Throws an error if a Ar ID is invalid
   * @param arId The Arweave ID to assert
   */
  assertArId(arId: unknown): void {
    if (!this.validArId(arId)) throw new Error("Invalid arId");
  }

  /**
   * Call burn function in Koii contract
   * @param contractId Contract ID to preregister to, content will be migrated to this contract
   * @param contentType Description field to be interpreted by the migration contract
   * @param contentTxId Content TxID of the contract for preregistration
   * @param reward Custom reward for smartweave transaction
   * @returns Transaction ID
   */
  burnKoi(
    contractId: string,
    contentType: string,
    contentTxId: string,
    reward?: string
  ): Promise<string> {
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
  async migrate(contractId?: string, reward?: string): Promise<string> {
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
  async syncOwnership(
    txId: string | string[],
    contractId?: string,
    reward?: string
  ): Promise<string> {
    contractId = contractId || (await this.getAttentionId());
    this.assertArId(contractId);
    if (typeof txId === "string") this.assertArId(txId);
    else for (const id of txId) this.assertArId(id);
    const input = { function: "syncOwnership", txId };
    return this.interactWrite(input, contractId, reward);
  }

  /**
   * Simple wrapper for burnKoi for the attention contract
   * @param nftTxId ID of the NFT to be preregistered
   * @param reward Custom reward for smartweave transaction
   * @returns Arweave transaction ID
   */
  async burnKoiAttention(nftTxId: string, reward?: string): Promise<string> {
    this.assertArId(nftTxId);
    return this.burnKoi(await this.getAttentionId(), "nft", nftTxId, reward);
  }

  /**
   * Simple wrapper for migrate for the attention contract
   * @param reward Custom reward for smartweave transaction
   * @returns Arweave transaction ID
   */
  async migrateAttention(reward?: string): Promise<string> {
    return this.migrate(await this.getAttentionId(), reward);
  }

  /**
   * Call lockBounty function in Koii contract
   * @param contractId  Task contract ID registered in koii contract
   * @param bounty Bounty to be locked by task creator
   * @param reward Custom reward for smartweave transaction
   * @returns Transaction ID
   */
  lockBounty(
    contractId: string,
    bounty: number,
    reward?: string
  ): Promise<string> {
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
  async signTransaction(tx: Transaction): Promise<unknown> {
    try {
      //const wallet = this.wallet;
      // Now we sign the transaction
      await arweave.transactions.sign(tx, this.wallet);
      // After is signed, we send the transaction
      //await exports.arweave.transactions.post(transaction);
      return tx;
    } catch (err) {
      return null;
    }
  }

  /**
   * Get transaction data from Arweave
   * @param txId Transaction ID
   * @returns Transaction
   */
  nftTransactionData(txId: string): Promise<Transaction> {
    return arweave.transactions.get(txId);
  }

  /**
   * Sign payload
   * @param payload Payload to sign
   * @returns Signed payload with signature
   */
  async signPayload(payload: BundlerPayload): Promise<BundlerPayload | null> {
    if (this.wallet === undefined) return null;
    const data = payload.data || payload.vote || null;
    const jwk = this.wallet;
    const publicModulus = jwk.n;
    const dataInString = JSON.stringify(data);
    const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
    const rawSignature = await arweave.crypto.sign(jwk, dataIn8Array);
    payload.signature = arweaveUtils.bufferTob64Url(rawSignature);
    payload.owner = publicModulus;
    return payload;
  }

  /**
   * Verify signed payload
   * @param payload
   * @returns Verification result
   */
  async verifySignature(payload: any): Promise<boolean> {
    const data = payload.data || payload.vote || null;
    const rawSignature = arweaveUtils.b64UrlToBuffer(payload.signature);
    const dataInString = JSON.stringify(data);
    const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
    return await arweave.crypto.verify(
      payload.owner,
      dataIn8Array,
      rawSignature
    );
  }

  /**
   * Posts data to Arweave
   * @param data
   * @returns Transaction ID
   */
  async postData(data: unknown): Promise<string | null> {
    // TODO: define data interface
    const wallet = this.wallet;
    const transaction = await arweave.createTransaction(
      {
        data: Buffer.from(JSON.stringify(data, null, 2), "utf8")
      },
      wallet
    );

    // Now we sign the transaction
    await arweave.transactions.sign(transaction, wallet);
    const txId = transaction.id;

    // After is signed, we send the transaction
    const response = await arweave.transactions.post(transaction);

    if (response.status === 200) return txId;

    return null;
  }

  /**
   * Gets all the transactions where the wallet is the owner
   * @param wallet Wallet address as a string
   * @param count The number of results to return
   * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
   * @returns Object with transaction IDs as keys, and transaction data strings as values
   */
  getOwnedTxs(
    wallet: string,
    count?: number,
    cursorId?: string
  ): Promise<unknown> {
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
  getRecipientTxs(
    wallet: string,
    count?: number,
    cursorId?: string
  ): Promise<unknown> {
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
  async getViewsAndEarnedKOII(
    nftIdArr: any,
    attentionState?: any
  ): Promise<unknown> {
    attentionState = attentionState || (await this.getState("attention"));
    const attentionReport = attentionState.task.attentionReport;

    let totalViews = 0,
      totalReward = 0;

    for (const report of attentionReport) {
      let totalAttention = 0;
      for (const nftId in report) {
        totalAttention += report[nftId];
        if (nftIdArr.includes(nftId)) totalViews += report[nftId];
      }

      const rewardPerAttention = 1000 / totalAttention;
      for (const nftId of nftIdArr) {
        if (nftId in report) totalReward += report[nftId] * rewardPerAttention;
      }
    }
    return { totalViews, totalReward };
  }

  /**
   *
   * Get a list of all NFT IDs
   * @returns Array of transaction IDs which are registered NFTs
   */
  async retrieveAllRegisteredContent(): Promise<string[]> {
    const state = await this.getState("attention");
    return Object.keys(state.nfts) as string[];
  }

  /**
   *
   * Get the list of NFTs tagged as NSFW
   * @returns {Object} - returns a array of NFTs tagged as NSFW
   */
  async getNsfwNfts(): Promise<unknown> {
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
      return gqlResp.data.transactions.edges.map((e: any) =>
        e.node ? e.node.id : ""
      );
    }
    return { message: "No NSFW NFTs Found" };
  }

  /**
   * Get a list of NFT IDs by owner
   * @param owner Wallet address of the owner
   * @returns Array containing the NFTs
   */
  async getNftIdsByOwner(owner: string): Promise<string[]> {
    const attentionState = await this.getState("attention");
    const nftIds = [];
    for (const nftId in attentionState.nfts) {
      if (
        Object.prototype.hasOwnProperty.call(attentionState.nfts[nftId], owner)
      )
        nftIds.push(nftId);
    }
    return nftIds;
  }

  /**
   * Get Koi rewards earned from an NFT
   * @param id The transaction id to process
   * @returns Koi rewards earned or null if the transaction is not a valid Koi NFT
   */
  async getNftReward(id: string): Promise<number | null> {
    return (await this.getNftState(id)).reward;
  }

  /**
   * Query Arweave using GQL
   * @param request Query string
   * @returns Object containing the query results
   */
  async gql(request: string): Promise<any> {
    const { data } = await axios.post(URL_ARWEAVE_GQL, request, {
      headers: { "content-type": "application/json" },
      adapter: axiosAdapter
    });
    return data;
  }

  /**
   * Gets an array of service nodes
   * @param url URL of the service node to retrieve the array from a known service node
   * @returns Array of service nodes
   */
  async getNodes(
    url: string = this.bundlerUrl
  ): Promise<Array<BundlerPayload>> {
    const res = await axios.get(url + BUNDLER_NODES, { adapter: axiosAdapter });
    try {
      return JSON.parse(res.data as string);
    } catch (_e) {
      return [];
    }
  }

  /**
   * Gets the list of all KIDs(DIDs)
   * @param count The number of results to return
   * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
   * @returns {Array} - returns a Javascript Array of object with each object representing a single KID
   */
  async getAllKID(count?: number, cursorId?: string): Promise<unknown> {
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
  async getKIDByWalletAddress(walletAddress?: string): Promise<unknown> {
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
  async createKID(KIDObject: any, image: any): Promise<unknown> {
    const initialState = KIDObject;
    if (
      initialState &&
      initialState.addresses &&
      initialState.addresses.Arweave
    ) {
      try {
        const tx = await arweave.createTransaction(
          {
            data: image.blobData
          },
          this.wallet
        );
        tx.addTag("Content-Type", image.contentType);
        tx.addTag("Network", "Koii");
        tx.addTag("Action", "KID/Create");
        tx.addTag("App-Name", "SmartWeaveContract");
        tx.addTag("App-Version", "0.1.0");
        tx.addTag(
          "Contract-Src",
          "t2jB63nGIWYUTDy2b00JPzSDtx1GQRsmKUeHtvZu1_A"
        );
        tx.addTag("Wallet-Address", initialState.addresses.Arweave);
        tx.addTag("Init-State", JSON.stringify(initialState));
        await arweave.transactions.sign(tx, this.wallet);
        const uploader = await arweave.transactions.getUploader(tx);
        while (!uploader.isComplete) {
          await uploader.uploadChunk();
          console.log(
            uploader.pctComplete + "% complete",
            uploader.uploadedChunks + "/" + uploader.totalChunks
          );
        }
        console.log("TX ID: ", tx.id);
        return tx.id;
      } catch (err) {
        console.log("create transaction error");
        console.log("err-transaction", err);
        return false;
      }
    } else {
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
  async updateKID(KIDObject: any, contractId: string): Promise<unknown> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    const txId = await interactWrite(arweave, wallet, contractId, {
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
  async createCollection(collectionObject: any): Promise<unknown> {
    const initialState = collectionObject;
    if (!collectionObject.owner) {
      console.log("collectionObject doesn't contain an owner");
      return false;
    }
    try {
      const tx = await arweave.createTransaction(
        {
          data: Buffer.from(collectionObject.owner, "utf8")
        },
        this.wallet
      );
      tx.addTag("Content-Type", "text/plain");
      tx.addTag("Network", "Koii");
      tx.addTag("Action", "Collection/Create");
      tx.addTag("App-Name", "SmartWeaveContract");
      tx.addTag("App-Version", "0.1.0");
      tx.addTag("Contract-Src", "NCepV_8bY831CMHK0LZQAQAVwZyNKLalmC36FlagLQE");
      tx.addTag("Wallet-Address", collectionObject.owner);
      tx.addTag("Init-State", JSON.stringify(initialState));
      await arweave.transactions.sign(tx, this.wallet);
      const uploader = await arweave.transactions.getUploader(tx);
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(
          uploader.pctComplete + "% complete",
          uploader.uploadedChunks + "/" + uploader.totalChunks
        );
      }
      console.log("TX ID: ", tx.id);
      return tx.id;
    } catch (err) {
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
  async getCollectionsByWalletAddress(
    walletAddress?: string,
    count?: number,
    cursorId?: string
  ): Promise<unknown> {
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
  addToCollection(nftId: string, contractId: string): Promise<unknown> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return interactWrite(arweave, wallet, contractId, {
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
  removeFromCollection(index: number, contractId: string): Promise<unknown> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return interactWrite(arweave, wallet, contractId, {
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
  updateView(newView: string, contractId: string): Promise<unknown> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return interactWrite(arweave, wallet, contractId, {
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
  updatePreviewImageIndex(
    imageIndex: number,
    contractId: string
  ): Promise<unknown> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return interactWrite(arweave, wallet, contractId, {
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
  updateCollection(collection: unknown, contractId: string): Promise<unknown> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return interactWrite(arweave, wallet, contractId, {
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
  interactWrite(
    input: unknown,
    contractId = this.contractId,
    reward?: string
  ): Promise<string> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
    return interactWrite(
      arweave,
      wallet,
      contractId,
      input,
      undefined,
      undefined,
      undefined,
      reward
    );
  }

  // Private functions
  /**
   * Generate a 12 word mnemonic for an Arweave key https://github.com/acolytec3/arweave-mnemonic-keys
   * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
   */
  private async _generateMnemonic(): Promise<string> {
    const keys = await generateKeyPair(
      { id: "rsa", modulusLength: 4096 },
      { privateKeyFormat: "pkcs1-pem" }
    );
    return keys.mnemonic;
  }

  /**
   * Generates a JWK object representation of an Arweave key
   * @param mnemonic - a 12 word mnemonic represented as a string
   * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
   */
  private async _getKeyFromMnemonic(mnemonic: string): Promise<JWKInterface> {
    const keyPair = await getKeyPairFromMnemonic(
      mnemonic,
      { id: "rsa", modulusLength: 4096 },
      { privateKeyFormat: "pkcs1-pem" }
    );

    //@ts-ignore Need to access private attribute
    const privateKey = pem2jwk(keyPair.privateKey);
    delete privateKey.alg;
    delete privateKey.key_ops;
    return privateKey;
  }
}

/**
 * Get info from Arweave net
 * @returns Axios response with info
 */
function getArweaveNetInfo(): Promise<AxiosResponse<any>> {
  return axios.get(URL_ARWEAVE_INFO, {
    adapter: axiosAdapter
  });
}

module.exports = {
  arweave,
  Common
};
