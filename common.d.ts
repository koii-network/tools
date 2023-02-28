import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import Transaction from "arweave/node/lib/transaction";
export interface BundlerPayload {
    data?: unknown;
    signature?: string;
    owner?: string;
    senderAddress?: string;
    vote?: Vote;
}
export interface Vote {
    voteId: number;
    direct?: string;
}
export interface RegistrationData {
    url: string;
    timestamp: number;
}
export declare const arweave: Arweave;
/**
 * Tools for interacting with the koi network
 */
export declare class Common {
    wallet?: JWKInterface;
    mnemonic?: string;
    address?: string;
    contractId: string;
    bundlerUrl: string;
    web3?: any;
    evmWalletAddress?: string;
    constructor(bundlerUrl?: string, contractId?: string);
    /**
     * Gets the current contract state
     * @returns Current KOI system state
     */
    getKoiiState(): Promise<any>;
    /**
     * Gets the current contract state
     * @returns Current KOI system state
     */
    getContractState(): Promise<unknown>;
    /**
     * Retrieves the a task state from the bundler
     * @param txId Transaction ID of the contract
     * @returns The contract state object
     */
    getState(txId: string): Promise<any>;
    /**
     * Get the updated state of an NFT from a service node
     *   A NFT state is different from a regular state in the sense that an NFT state includes
     *   rewards and attention from an Attention state
     * @param id ID of the NFT to get
     * @returns State of an NFT including views and reward
     */
    getNftState(id: string): Promise<any>;
    /**
     * Depreciated wrapper for getNftState
     */
    contentView(id: string): Promise<unknown>;
    /**
     * Depreciated wrapper for getNftState
     */
    readNftState(id: string): Promise<unknown>;
    /**
     * Wrapper for smartweaveReadContract
     *  This function is not recommended for use and should be avoided as smartweave readContract
     *  can be very slow
     * @param contractId contractId to be read
     * @returns state of the contract read
     */
    swReadContract(contractId: string): Promise<unknown>;
    /**
     * Gets the attention contract ID running on the bundler
     * @returns Attention contract ID running on the bundler as a string
     */
    getAttentionId(): Promise<string>;
    /**
     * Generates wallet optionally with a mnemonic phrase
     * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
     */
    generateWallet(use_mnemonic?: boolean): Promise<Error | true>;
    /**
     * Loads arweave wallet
     * @param source object to load from, JSON or JWK, or mnemonic key
     */
    loadWallet(source: unknown): Promise<JWKInterface>;
    /**
     * Manually set wallet address
     * @param walletAddress Address as a string
     * @returns Wallet address
     */
    setWallet(walletAddress: string): string;
    /**
     * Manually set any EVM compatible wallet address
     * @param walletAddress EVM compatible Address as a string
     * @param evmNetworkProvider EVM compatible Network Provider URL (For example https://mainnet.infura.io/v3/xxxxxxxxxxxxxxxxx in case of ethereum mainnet)
     * @returns Wallet address
     */
    initializeEvmWalletAndProvider(walletAddress: string, evmNetworkProvider: string): string;
    initializeEthWalletAndProvider(walletAddress: string, evmNetworkProvider: string): string;
    /**
     * Gets EVM compatible wallet balance
     * @returns balance in EVM compatible currency
     */
    getEvmWalletBalance(): Promise<string>;
    /**
     * Estimates the gas fees required for this particular tx
     * @param object A transaction object - see web3.eth.sendTransaction for detail
     * @returns The used gas for the simulated call/transaction.
     */
    estimateGasEvm(object: unknown): Promise<number>;
    estimateGasEth(object: unknown): Promise<number>;
    /**
     * Estimates the gas fees required for this particular tx
     * @param toAddress The address whom to send the currency
     * @param amount The amount of currency to send
     * @param privateKey The privateKey for the sender wallet
     * @returns The receipt for the transaction
     */
    transferEvm(toAddress: string, amount: number, privateKey: string): Promise<unknown>;
    transferEth(toAddress: string, amount: number, privateKey: string): Promise<unknown>;
    /**
     * signs payload from EVM compatible wallet
     * @param data The actual payload to be signed
     * @param evmPrivateKey EVM compatible Private Key as a string
     * @returns balance in ether
     */
    signPayloadEvm(data: unknown, evmPrivateKey: string): unknown;
    /**
     * creates EVM compatible wallet
     * @returns EVM compatible wallet
     */
    createEvmWallet(): unknown;
    /**
     * creates EVM compatible wallet
     * @param evmPrivateKey EVM compatible Private Key as a string
     * @returns EVM compatible wallet
     */
    getEvmWalletByPrivateKey(evmPrivateKey: string): unknown;
    /**
     * Gets all transactions for a particular EVM compatible wallet
     * @param APIKey APIKey to fetch the txs
     * @param network Specifies the network of txs to be fetched - Defaults to RINKEBY (RINKEBY, MAINNET, POLYGON or MUMBAI)
     * @param offset Number of transactions to return - Defaults to 50
     * @param walletAddress optional param, to fetch txs of other wallet address than the loaded one
     * @returns EVM compatible wallet
     */
    getAllEvmTransactions(APIKey: string, network: string | undefined, offset: number | undefined, walletAddress: string): Promise<unknown>;
    /**
     * Uses koi wallet to get the address
     * @returns Wallet address
     */
    getWalletAddress(): Promise<string>;
    /**
     * Get and set arweave balance
     * @returns Balance as a string if wallet exists, else undefined
     */
    getWalletBalance(): Promise<number>;
    /**
     * Gets koi balance from cache
     * @returns Balance as a number
     */
    getKoiBalance(): Promise<number>;
    /**
     * Get contract state
     * @param id Transaction ID
     * @returns State object
     */
    getTransaction(id: string): Promise<Transaction>;
    /**
     * Get block height
     * @returns Block height maybe number
     */
    getBlockHeight(): Promise<unknown>;
    /**
     * Interact with contract to stake
     * @param qty Quantity to stake
     * @returns Transaction ID
     */
    stake(qty: number): Promise<string>;
    /**
     * Interact with contract to withdraw
     * @param qty Quantity to transfer
     * @returns Transaction ID
     */
    withdraw(qty: number): Promise<string>;
    /**
     * Interact with contract to transfer koi
     * @param qty Quantity to transfer
     * @param target Receiver address
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    transfer(qty: number, target: string, token: string, reward?: string): Promise<string>;
    /**
     * Mint koi
     * @param arg object arg.targetAddress(receiver address) and arg.qty(amount to mint)
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    mint(arg: any, reward?: string): Promise<string>;
    /**
     * Transfer NFT ownership
     * @param nftId NFT ID to transfer
     * @param qty Quantity of NFT balance to transfer
     * @param target Target address to transfer ownership to
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    transferNft(nftId: string, qty: number, target: string, reward?: string): Promise<string>;
    /**
     * Checks the validity of an Ar (transaction, address) ID
     *  TODO: check if arId is base64url compatible (only alphanumeric including -_ )
     * @param arId The Arweave ID to validate
     * @returns Validity of txId
     */
    validArId(arId: any): boolean;
    /**
     * Throws an error if a Ar ID is invalid
     * @param arId The Arweave ID to assert
     */
    assertArId(arId: unknown): void;
    /**
     * Call burn function in Koii contract
     * @param contractId Contract ID to preregister to, content will be migrated to this contract
     * @param contentType Description field to be interpreted by the migration contract
     * @param contentTxId Content TxID of the contract for preregistration
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    burnKoi(contractId: string, contentType: string, contentTxId: string, reward?: string): Promise<string>;
    /**
     * Call migration function in a contract
     * @param contractId Contract ID to migrate content to, defaults to attention contract
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    migrate(contractId?: string, reward?: string): Promise<string>;
    /**
     * Call syncOwnership function on attention contract
     * @param txId NFT id to be synchronized, can be an array if caller == attention contract owner
     * @param contractId Contract to call syncOwnership on, defaults to attention contract
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    syncOwnership(txId: string | string[], contractId?: string, reward?: string): Promise<string>;
    /**
     * Simple wrapper for burnKoi for the attention contract
     * @param nftTxId ID of the NFT to be preregistered
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    burnKoiAttention(nftTxId: string, reward?: string): Promise<string>;
    /**
     * Simple wrapper for migrate for the attention contract
     * @param reward Custom reward for smartweave transaction
     * @returns Arweave transaction ID
     */
    migrateAttention(reward?: string): Promise<string>;
    /**
     * Call lockBounty function in Koii contract
     * @param contractId  Task contract ID registered in koii contract
     * @param bounty Bounty to be locked by task creator
     * @param reward Custom reward for smartweave transaction
     * @returns Transaction ID
     */
    lockBounty(contractId: string, bounty: number, reward?: string): Promise<string>;
    /**
     * Sign transaction
     * @param tx Transaction to be signed
     * @returns signed Transaction
     */
    signTransaction(tx: Transaction): Promise<unknown>;
    /**
     * Get transaction data from Arweave
     * @param txId Transaction ID
     * @returns Transaction
     */
    nftTransactionData(txId: string): Promise<Transaction>;
    /**
     * Sign payload
     * @param payload Payload to sign
     * @returns Signed payload with signature
     */
    signPayload(payload: BundlerPayload): Promise<BundlerPayload | null>;
    /**
     * Verify signed payload
     * @param payload
     * @returns Verification result
     */
    verifySignature(payload: any): Promise<boolean>;
    /**
     * Posts data to Arweave
     * @param data
     * @returns Transaction ID
     */
    postData(data: unknown): Promise<string | null>;
    /**
     * Gets all the transactions where the wallet is the owner
     * @param wallet Wallet address as a string
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns Object with transaction IDs as keys, and transaction data strings as values
     */
    getOwnedTxs(wallet: string, count?: number, cursorId?: string): Promise<unknown>;
    /**
     * Gets all the transactions where the wallet is the recipient
     * @param wallet Wallet address as a string
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns Object with transaction IDs as keys, and transaction data strings as values
     */
    getRecipientTxs(wallet: string, count?: number, cursorId?: string): Promise<unknown>;
    /**
     *  Calculates total Views and earned KOII for given NFTIds Array
     * @param nftIdArr The array of NFTIds for which total Views and earned KOII will be calculated
     * @param attentionState The Koii state used to sum views and koii
     * @returns An object containing totalViews and totalRewards
     */
    getViewsAndEarnedKOII(nftIdArr: any, attentionState?: any): Promise<unknown>;
    /**
     *
     * Get a list of all NFT IDs
     * @returns Array of transaction IDs which are registered NFTs
     */
    retrieveAllRegisteredContent(): Promise<string[]>;
    /**
     *
     * Get the list of NFTs tagged as NSFW
     * @returns {Object} - returns a array of NFTs tagged as NSFW
     */
    getNsfwNfts(): Promise<unknown>;
    /**
     * Get a list of NFT IDs by owner
     * @param owner Wallet address of the owner
     * @returns Array containing the NFTs
     */
    getNftIdsByOwner(owner: string): Promise<string[]>;
    /**
     * Get Koi rewards earned from an NFT
     * @param id The transaction id to process
     * @returns Koi rewards earned or null if the transaction is not a valid Koi NFT
     */
    getNftReward(id: string): Promise<number | null>;
    /**
     * Query Arweave using GQL
     * @param request Query string
     * @returns Object containing the query results
     */
    gql(request: string): Promise<any>;
    /**
     * Gets an array of service nodes
     * @param url URL of the service node to retrieve the array from a known service node
     * @returns Array of service nodes
     */
    getNodes(url?: string): Promise<Array<BundlerPayload>>;
    /**
     * Gets the list of all KIDs(DIDs)
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns {Array} - returns a Javascript Array of object with each object representing a single KID
     */
    getAllKID(count?: number, cursorId?: string): Promise<unknown>;
    /**
     * Get the KID state for the particular walletAddress
     * @param walletAddress The wallet address for the person whose DID is to be found
     * @returns {Object} - returns a contract object having id which can be used to get the state
     */
    getKIDByWalletAddress(walletAddress?: string): Promise<unknown>;
    /**
     * Creates a KID smartcontract on arweave
     * @param KIDObject - an object containing name, description, addresses and link
     * @param image - an object containing contentType and blobData
     * @returns {txId} - returns a txId in case of success and false in case of failure
     */
    createKID(KIDObject: any, image: any): Promise<unknown>;
    /**
     * Updates the state of a KID smartcontract on arweave
     * @param KIDObject - an object containing name, description, addresses and link
     * @param contractId - the contract Id for KID to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updateKID(KIDObject: any, contractId: string): Promise<unknown>;
    /**
     * Creates a NFT Collection smartcontract on arweave
     * @param collectionObject - an object containing name, description, addresses and link
     * @returns {txId} - returns a txId in case of success and false in case of failure
     */
    createCollection(collectionObject: any): Promise<unknown>;
    /**
     * Gets the list of all Collections by walletAddress
     * @param walletAddress The wallet address for the person whose DID is to be found
     * @param count The number of results to return
     * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
     * @returns {Array} - returns a Javascript Array of object with each object representing a Collection object (The collection object contains id which can be used in func readState to get actual state)
     */
    getCollectionsByWalletAddress(walletAddress?: string, count?: number, cursorId?: string): Promise<unknown>;
    /**
     * Add new NFTs to the existing collection
     * @param nftId - The transaction id of the NFT to be added to the collection
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    addToCollection(nftId: string, contractId: string): Promise<unknown>;
    /**
     * Remove NFTs from the existing collection
     * @param index - The index of the NFT which is to be removed from the collection
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    removeFromCollection(index: number, contractId: string): Promise<unknown>;
    /**
     * Updates the view of the existing Collection
     * @param newView - The view you want to set for the collection to display (Initialized with 'default')
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updateView(newView: string, contractId: string): Promise<unknown>;
    /**
     * Updates the index of the NFT which should be used as the preview for the collection
     * @param imageIndex - The index of the NFT which should be used as the preview for the collection
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updatePreviewImageIndex(imageIndex: number, contractId: string): Promise<unknown>;
    /**
     * Updates the array of NFTs from which the collection is composed of (Can be used to reorder the NFts in the collection also)
     * @param collection - The array of NFTs from which the collection is composed of.
     * @param contractId - the contract Id for Collection to be updated
     * @returns {txId} - returns a transaction id of arweave for the updateKID
     */
    updateCollection(collection: unknown, contractId: string): Promise<unknown>;
    /**
     * Writes to contract
     * @param input Passes to write function, in order to execute a contract function
     * @param contractId Contract to write to, defaults to Koii contract
     *  @param reward Custom reward for txs, if needed.
     * @returns Transaction ID
     */
    interactWrite(input: unknown, contractId?: string, reward?: string): Promise<string>;
    /**
     * Generate a 12 word mnemonic for an Arweave key https://github.com/acolytec3/arweave-mnemonic-keys
     * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
     */
    private _generateMnemonic;
    /**
     * Generates a JWK object representation of an Arweave key
     * @param mnemonic - a 12 word mnemonic represented as a string
     * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
     */
    private _getKeyFromMnemonic;
}
