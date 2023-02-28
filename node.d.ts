import { Common } from "./common";
import { RedisClient } from "redis";
export declare const URL_GATEWAY_LOGS = "https://gatewayv2.koi.rocks/logs";
interface redisConfig {
    redis_ip?: string;
    redis_port?: number;
    redis_password?: string;
}
export declare class Node extends Common {
    totalVoted: number;
    receipts: Array<unknown>;
    redisClient?: RedisClient;
    /**
     * Retrieves the current state in kohaku cache and triggers an update for the next request
     * @param txId Contract whose state to get
     * @returns Latest cached contract state
     */
    getState(txId: string): Promise<unknown> | any;
    /**
     * Retrieves the current state bypassing cache
     * @param txId Contract whose state to get
     * @returns Latest contract state
     */
    getStateAwait(txId: string): any;
    /**
     * @returns Cached Koii contract state
     */
    getKoiiState(): Promise<unknown> | any;
    /**
     * @returns Koii contract state bypassing cache
     */
    getKoiiStateAwait(): Promise<unknown>;
    /**
     * Depreciated wrapper for getKoiiState
     */
    getContractState(): Promise<unknown> | any;
    /**
     * Asynchronously load a wallet from a UTF8 JSON file
     * @param file Path of the file to be loaded
     * @returns JSON representation of the object
     */
    loadFile(file: string): Promise<unknown>;
    /**
     * Loads redis client
     */
    loadRedisClient(config?: redisConfig): void;
    /**
     * Store data in Redis async
     * @param key Redis key of data
     * @param value String to store in redis
     * @returns
     */
    redisSetAsync(key: string, value: string): Promise<void>;
    /**
     * Get Redis Keys
     * @param pattern Redis key of data
     * @returns
     */
    redisKeysAsync(pattern: string): Promise<Array<string> | null>;
    /**
     * Del Redis Keys
     * @param key key to delete
     * @returns
     */
    redisDelAsync(key: string): Promise<number | null>;
    /**
     * Get data from Redis async
     * @param key Redis key of data
     * @returns Data as a string, null if no such key exists
     */
    redisGetAsync(key: string): Promise<string | null>;
}
export {};
