"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = exports.URL_GATEWAY_LOGS = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const common_1 = require("./common");
const promises_1 = require("fs/promises");
const redis_1 = __importDefault(require("redis"));
//@ts-ignore
const kohaku_1 = __importDefault(require("@_koi/kohaku"));
exports.URL_GATEWAY_LOGS = "https://gatewayv2.koi.rocks/logs";
const READ_COOLDOWN = 60000;
let kohakuNextRead = 0;
class Node extends common_1.Common {
    constructor() {
        super(...arguments);
        this.totalVoted = -1;
        this.receipts = [];
    }
    /**
     * Retrieves the current state in kohaku cache and triggers an update for the next request
     * @param txId Contract whose state to get
     * @returns Latest cached contract state
     */
    getState(txId) {
        if (process.env.NODE_MODE !== "service")
            return super.getState(txId);
        let cached;
        try {
            cached = JSON.parse(kohaku_1.default.readContractCache(txId));
        }
        catch {
            // Not in cache
        }
        // If empty, return awaitable promise
        const now = Date.now();
        if (!cached) {
            kohakuNextRead = now + READ_COOLDOWN;
            return kohaku_1.default.readContract(common_1.arweave, txId);
        }
        if (now > kohakuNextRead) {
            kohakuNextRead = now + READ_COOLDOWN;
            // Update cache but don't await
            kohaku_1.default.readContract(common_1.arweave, txId).catch((e) => {
                console.error("Koii SDK error while updating state async:", e.message);
            });
        }
        return cached;
    }
    /**
     * Retrieves the current state bypassing cache
     * @param txId Contract whose state to get
     * @returns Latest contract state
     */
    getStateAwait(txId) {
        kohakuNextRead += Date.now() + READ_COOLDOWN;
        return kohaku_1.default.readContract(common_1.arweave, txId);
    }
    /**
     * @returns Cached Koii contract state
     */
    getKoiiState() {
        if (process.env.NODE_MODE !== "service")
            return super.getKoiiState();
        return this.getState(this.contractId);
    }
    /**
     * @returns Koii contract state bypassing cache
     */
    getKoiiStateAwait() {
        return this.getStateAwait(this.contractId);
    }
    /**
     * Depreciated wrapper for getKoiiState
     */
    getContractState() {
        console.warn("getContractState is depreciated. Use getKoiiState");
        return this.getKoiiState();
    }
    /**
     * Asynchronously load a wallet from a UTF8 JSON file
     * @param file Path of the file to be loaded
     * @returns JSON representation of the object
     */
    async loadFile(file) {
        const data = await (0, promises_1.readFile)(file, "utf8");
        return JSON.parse(data);
    }
    /**
     * Loads redis client
     */
    loadRedisClient(config) {
        const host = config && config.redis_ip ? config.redis_ip : process.env.REDIS_IP;
        const port = config && config.redis_port
            ? config.redis_port
            : parseInt(process.env.REDIS_PORT);
        const password = config && config.redis_password
            ? config.redis_password
            : process.env.REDIS_PASSWORD;
        if (!host || !port)
            throw Error("CANNOT READ REDIS IP OR PORT FROM ENV");
        this.redisClient = redis_1.default.createClient({ port, host, password });
        this.redisClient.on("error", function (error) {
            console.error("redisClient " + error);
        });
    }
    /**
     * Store data in Redis async
     * @param key Redis key of data
     * @param value String to store in redis
     * @returns
     */
    redisSetAsync(key, value) {
        return new Promise((resolve, reject) => {
            if (this.redisClient === undefined)
                reject("Redis not connected");
            else
                this.redisClient.set(key, value, (err) => {
                    err ? reject(err) : resolve();
                });
        });
    }
    /**
     * Get Redis Keys
     * @param pattern Redis key of data
     * @returns
     */
    redisKeysAsync(pattern) {
        return new Promise((resolve, reject) => {
            if (this.redisClient === undefined)
                reject("Redis not connected");
            else
                this.redisClient.keys(pattern, (err, res) => {
                    err ? reject(err) : resolve(res);
                });
        });
    }
    /**
     * Del Redis Keys
     * @param key key to delete
     * @returns
     */
    redisDelAsync(key) {
        return new Promise((resolve, reject) => {
            if (this.redisClient === undefined)
                reject("Redis not connected");
            else
                this.redisClient.del(key, (err, res) => {
                    err ? reject(err) : resolve(res);
                });
        });
    }
    /**
     * Get data from Redis async
     * @param key Redis key of data
     * @returns Data as a string, null if no such key exists
     */
    redisGetAsync(key) {
        return new Promise((resolve, reject) => {
            if (this.redisClient === undefined)
                reject("Redis not connected");
            else
                this.redisClient.get(key, (err, res) => {
                    err ? reject(err) : resolve(res);
                });
        });
    }
}
exports.Node = Node;
module.exports = { Node, URL_GATEWAY_LOGS: exports.URL_GATEWAY_LOGS };
//# sourceMappingURL=node.js.map