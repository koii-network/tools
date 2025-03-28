# @_koii/sdk - Koii Network SDK

## Project Overview

The @_koii/sdk is a comprehensive TypeScript library that provides developers with powerful tools and utilities for interacting with the Koii Network. This SDK simplifies blockchain development by offering cross-platform support, robust state management, and seamless integration with multiple blockchain technologies.

### Key Features
- 🌐 Multi-Blockchain Support: Works with Ethereum, Solana, and Koii networks
- 🔒 Secure Wallet and Key Management
- 🚀 Easy Contract State Retrieval
- 💾 Redis Integration for Caching and Data Storage
- 🔍 Advanced State Querying Capabilities
- 🧩 Flexible and Extensible Architecture

## Installation

Install the SDK using npm:

```bash
npm install @_koii/sdk
```

### Prerequisites
- Node.js (v14.0.0 or later)
- TypeScript (optional, but recommended)

## API Reference

### Node Class

#### Constructor
```typescript
const node = new Node(options?: NodeOptions)
```

#### Methods

##### State Management
- `getState(txId: string)`: Retrieve contract state with intelligent caching
  ```typescript
  const state = await node.getState('contractTxId')
  ```

- `getStateAwait(txId: string)`: Force retrieve latest contract state
  ```typescript
  const freshState = await node.getStateAwait('contractTxId')
  ```

##### File and Wallet Management
- `loadFile(filePath: string)`: Load JSON file asynchronously
  ```typescript
  const walletData = await node.loadFile('/path/to/wallet.json')
  ```

##### Redis Integration
- `loadRedisClient(config?: RedisConfig)`: Initialize Redis connection
  ```typescript
  node.loadRedisClient({
    redis_ip: 'localhost',
    redis_port: 6379,
    redis_password: 'optional_password'
  })
  ```

- `redisSetAsync(key: string, value: string)`: Store data in Redis
- `redisGetAsync(key: string)`: Retrieve data from Redis
- `redisDelAsync(key: string)`: Delete Redis key

### Web Class
(Refer to source code for detailed Web class methods)

### Constants
- `URL_GATEWAY_LOGS`: Gateway logs URL for Koii Network

## Repository Structure
- `src/`: TypeScript source files
  - `common.ts`: Common utilities and base classes
  - `node.ts`: Node-specific implementations
  - `web.ts`: Web-specific implementations
  - `ethereum.ts`: Ethereum blockchain interactions
  - `solana.ts`: Solana blockchain interactions
- `test/`: Unit and integration tests
- `docs/`: Documentation files

## Configuration

### Environment Variables
- `NODE_MODE`: Set to "service" for enhanced caching
- `REDIS_IP`: Redis server IP
- `REDIS_PORT`: Redis server port
- `REDIS_PASSWORD`: Redis authentication password

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Running Tests
```bash
npm test
```

## License
Distributed under the ISC License. See `LICENSE` file for more information.

## Contact
Koii Network - [Official Website](https://www.koii.network)

Project Link: [https://github.com/koii-network/tools](https://github.com/koii-network/tools)