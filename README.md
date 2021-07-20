# Koi JavaScript SDK

The Koi.js library enables node.js and javascript/typescript applications to easily interact with the open Koi network.

## Steps to Interact with the SDK in your Project

1. Add the sdk to your project

   You can use either npm or yarn
   ```
   npm i @_koi/sdk
   yarn add @_koi/sdk
   ```

2. Add the Koi-tools module to your script and then initialize the koi class.

   ```
   import * as kweb from "@_koi/sdk/web";
   const ktools = new kweb.Web();
   ```
   or with CommonJS
   ```
   const kweb = require("@_koi/sdk/web");
   const ktools = new kweb.Web();
   ```
   or using the bundle
   ```
   <script src="koi_tools.js"></script>
   ...
   const kweb = koi_tools.koi_web;
   const ktools = new kweb.Web();
   ```

Note: This library changes often, so if `npm i koi-tools` does not work, check for beta releases on NPM under the versions section or manually build the package. See [#Build](#Build) section below.

3. Optional - Add the Arweave module to your project if your app plans to directly transact with the permaweb outside of using the Koi-tools library

   ```
   const Arweave = require('arweave/node')
   const arweave = Arweave.init({
     host: 'arweave.net',
     protocol: 'https',
     port: 443
   });
   ```

4. Create an RSA Wallet Key

   Note that the wallet address should not be held inside of your project when you check the project into GitHub

   ```
   var walletKeyLocation = "path/to/wallet.json";
   ```

   If you don't have a wallet, you can get one from the faucet at [koi.rocks](https://koi.rocks/) or the Arweave faucet at [faucet.arweave.org](https://faucet.arweave.org/).
5. Define a function to bootstrap your app and utilize the koi-tools library `loadWallet` method to be returned the address of your wallet from the permaweb.

   ```
   async function start() {

     console.log("running async block", ktools)

     await ktools.loadWallet(walletKeyLocation)

     try {
       // define async functions here that interact with the koi library upon app startup such as verifying signed payloads

     } catch (err) {
       throw Error(err)
     }

   }

   start()
   ```

   If you are just testing with a local bundler, you can also use `await ktools.generateWallet()` to create a custom key file just for that runtime. (TODO: Expand support for 12 word seed phrase).

6. Check out the test.js file held in this library with examples of how to interact with koi-tools.

## Content Rewards

The Koi consensus process releases 1,000 KOI tokens per day to reward the best content that has ever been registered, proportional to the attention it receives in that time period.

Fetch all registered records:

```
var records = koiTools.retrieveAllRegisteredContent();
```
This will print a full list of all registered NFTs by txID, which can then be fetched using the bundler endpoints of any Koii node:
```
var nftdata = await fetch(`https://bundler.openkoi.com:8888/state/nft?tranxId=${id}`)
```

Your wallet will receive a portion of the daily KOI tokens every time your content is viewed.

If you do not have a KOI balance, you cannot participate. Your KOI will be burned to register the content.

## Coming Soon: KOI Tasks

In order to ensure everyone has open access to the network, we're working on making it possible for nodes to run 'tasks' for each other to earn tokens.

## Build

### NPM

```
yarn install
yarn build
yarn publish dist
```

For beta releases
 - append `-beta.N` to `dist/package.json` version where N is the beta version
 - use `yarn publish dist --tag beta`

### Webpack

```
yarn install
yarn bundle
```
Test with `yarn test`
