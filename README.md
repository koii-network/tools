# Koii JavaScript SDK

The Koii.js library enables node.js and javascript/typescript applications to easily interact with the open Koi network.

## Steps to Interact with the SDK in your Project

1. Add the sdk to your project

   You can use either npm or yarn

   ```
   npm i @_koii/sdk
   yarn add @_koii/sdk
   ```

2. Add the Koi-tools module to your script and then initialize the koi class.

   ```
   import * as kweb from "@_koii/sdk/web.js";
   const tools = new kweb.Web();
   ```

   or with CommonJS

   ```
   const kweb = require("@_koii/sdk/web");
   const tools = new kweb.Web();
   ```

   or using the bundle

   ```
   <script src="koi_tools.js"></script>
   ...
   const kweb = koi_tools.koi_web;
   const tools = new kweb.Web();
   ```

Note: This library changes often, so if `npm i @_koii/sdk` does not work, check for beta releases on NPM under the versions section or manually build the package (See [#Build](#Build) section below).

3. Optional - Add the Arweave module to your project if your app plans to directly transact with the permaweb outside of using the Koi-tools library

   ```
   const Arweave = require("arweave");
   const arweave = Arweave.init({
      host: "arweave.net",
      port: 443,
      protocol: "https"
   });
   ```

4. Create an RSA Wallet Key

   Note that the wallet address should not be held inside of your project when you check the project into GitHub

   ```
   var walletKeyLocation = "path/to/wallet.json";
   ```


5. Define a function to bootstrap your app and utilize the koi-tools `loadWallet`.

   ```
   async function main() {
      const jwk = await tools.loadFile(walletPath);
      await tools.loadWallet(jwk);

   }

   main();
   ```

   If you are just testing with a local bundler, you can also use `await tools.generateWallet()` to create a custom key file just for that runtime.

6. Check out the test folder for examples of how to interact with koi-tools.

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

Test with `yarn test`

### Webpack

```
yarn install
yarn bundle
```

Test with `yarn test-bundle`
