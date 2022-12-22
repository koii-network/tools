"use strict";

const kcommon = require("../dist/common");
const ktools = new kcommon.Common();

test("Generate wallet", async () => {
  expect(await ktools.generateWallet()).toBe(true);
  expect(ktools.wallet.kty).toBe("RSA");
});

test("Get wallet balance", async () => {
  expect(await ktools.getWalletBalance()).toBeLessThan(1);
});

test("Get block height", async () => {
  expect(await ktools.getBlockHeight()).toBeGreaterThan(0);
});

test("Mint", async () => {
  const submission = {
    targetAddress: "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo",
    qty: 5
  };
  const txId = await ktools.mint(submission);
  expect(typeof txId).toBe("string");
  expect(txId.trim()).not.toHaveLength(0);
});

test("Sign payload", async () => {
  let payload = {
    vote: "FooBar",
    senderAddress: "",
  }
  const signedPayload = await ktools.signPayload(payload);

  const signature = signedPayload.signature;
  expect(typeof signature).toBe("string");
  expect(signature.trim()).not.toHaveLength(0);

  const owner = signedPayload.owner;
  expect(typeof owner).toBe("string");
  expect(owner.trim()).not.toHaveLength(0);
});

test("Verify signature", async () => {
  let payload = {
    vote: "FooBar",
    senderAddress: "",
  }
  const signedPayload = await ktools.signPayload(payload);

  expect(await ktools.verifySignature(signedPayload)).toBe(true);
});

test("Arweave GQL", async () => {
  const query = "query { transactions(block: {min: 0, max: 10}) { edges { node { id } } } }";
  const request = JSON.stringify({query});
  const res = await ktools.gql(request);
  expect(res).toBeTruthy();
});

// test("Get owned transactions", async () => {
//   const transactions = await ktools.getOwnedTxs("ou-OUmrWuT0hnSiUMoyhGEbd3s5b_ce8QK0vhNwmno4", 2);
//   expect(transactions.data.transactions.edges.length).toBe(2);
// });

test("Get recipient transactions", async () => {
  const transactions = await ktools.getRecipientTxs("ou-OUmrWuT0hnSiUMoyhGEbd3s5b_ce8QK0vhNwmno4", 3);
  expect(transactions.data.transactions.edges.length).toBe(3);
});

test("Sign transaction", async () => {
  const transaction = await ktools.arweave.createTransaction(
    {
      data: Buffer.from('Some data', 'utf8')
    }
  );
  const signedTransaction = await ktools.signTransaction(transaction);
  expect(typeof signedTransaction.signature).toBe("string");
  expect(signedTransaction.signature.trim()).not.toHaveLength(0);
});

test("Get NFT state", async () => {
  const nftState = await ktools.getNftState("Vh-o7iOqOYOOHhUW2z9prtrtH8hymQyjX-rTxAY0jjU");
  expect(nftState.title).toEqual("rollies #00007");
});

test("Get owner nfts", async () => {
  const owner = "IsAUH6ruDQgbhr7SvfYUFzQJO-6MGXaRFfJ0FIyHvOQ";
  const nfts = await ktools.getNftIdsByOwner(owner);
  expect(nfts.length).toBeGreaterThan(3);
});

test("Get NFT reward", async () => {
  const reward = await ktools.getNftReward("1UDe0Wqh51-O03efPzoc_HhsUPrmgBR2ziUfaI7CpZk");
  //expect(reward).toBeGreaterThanOrEqual(0);
  expect(reward).toBeGreaterThan(1600);
});

test("Get Views And Earned KOII", async () => {
  const NFT_ID_ARR = [
    "Vh-o7iOqOYOOHhUW2z9prtrtH8hymQyjX-rTxAY0jjU",
    "9FD54GbueDjQ1_wXgBEkLVtmaMQxdM23CIysMaAh8ng"
  ]
  const view = await ktools.getViewsAndEarnedKOII(NFT_ID_ARR);

  //expect(view.totalViews).toBeGreaterThanOrEqual(0);
  expect(view.totalViews).toBeGreaterThan(11000);
});

test("Get attentionId", async () => {
  const attentionId = await ktools.getAttentionId();
  expect(typeof attentionId).toEqual("string");
  expect(attentionId.length).toEqual(43);
});

test("Generate Keys from mnemonic", async () => {
  const mnemonic = "pill tomorrow foster begin walnut borrow virtual kick shift mutual shoe scatter";
  const wallet = await ktools.generateSolanaKeyFromMnemonic(mnemonic);
  expect(typeof wallet.address).toEqual("string");
  expect(typeof wallet.privateKey).toEqual("string");
});

// test("generate mnemonic", async () => {
//   expect(await ktools.generateWallet(true)).toBeTruthy();
// });
