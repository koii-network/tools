import * as kcommon from "../src/common";

const ktools = new kcommon.Common();

describe("Common class", () => {
  it("should generate wallet", async () => {
    expect(await ktools.generateWallet()).toBe(true);
    expect(ktools.wallet!.kty).toBe("RSA");
  });

  it("should get wallet balance", async () => {
    expect(await ktools.getWalletBalance()).toBeLessThan(1);
  });

  it("should get block height", async () => {
    jest.setTimeout(15000);
    expect(await ktools.getBlockHeight()).toBeGreaterThan(0);
  });

  it("should mint", async () => {
    jest.setTimeout(60000);
    const submission = {
      targetAddress: "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo",
      qty: 5
    };
    const txId = await ktools.mint(submission);
    expect(typeof txId).toBe("string");
    expect(txId.trim()).not.toHaveLength(0);
  });

  it("should sign payload", async () => {
    const payload = {
      data: "FooBar",
      senderAddress: ""
    };
    const signedPayload = await ktools.signPayload(payload);

    const signature = signedPayload!.signature!;
    expect(typeof signature).toBe("string");
    expect(signature.trim()).not.toHaveLength(0);

    const owner = signedPayload!.owner!;
    expect(typeof owner).toBe("string");
    expect(owner.trim()).not.toHaveLength(0);
  });

  it("should verify signature", async () => {
    const payload = {
      data: "FooBar",
      senderAddress: ""
    };
    const signedPayload = await ktools.signPayload(payload);

    expect(await ktools.verifySignature(signedPayload)).toBe(true);
  });

  it("should Arweave GQL", async () => {
    jest.setTimeout(15000);
    const query =
      "query { transactions(block: {min: 0, max: 10}) { edges { node { id } } } }";
    const request = JSON.stringify({ query });
    const res = await ktools.gql(request);
    expect(res).toBeTruthy();
  });

  // it("should Get owned transactions", async () => {
  //   jest.setTimeout(15000);
  //   const transactions = await ktools.getOwnedTxs("ou-OUmrWuT0hnSiUMoyhGEbd3s5b_ce8QK0vhNwmno4", 2);
  //   expect(transactions.data.transactions.edges.length).toBe(2);
  // });

  it("should get recipient transactions", async () => {
    jest.setTimeout(15000);
    const transactions = await ktools.getRecipientTxs(
      "ou-OUmrWuT0hnSiUMoyhGEbd3s5b_ce8QK0vhNwmno4",
      3
    );
    expect((transactions as any).data.transactions.edges.length).toBe(3);
  });

  it("should sign transaction", async () => {
    const transaction = await kcommon.arweave.createTransaction({
      data: Buffer.from("Some data", "utf8")
    });
    const signedTransaction = await ktools.signTransaction(transaction);
    expect(typeof signedTransaction?.signature).toBe("string");
    expect(signedTransaction?.signature.trim()).not.toHaveLength(0);
  });

  it("should get NFT state", async () => {
    const nftState = await ktools.getNftState(
      "Vh-o7iOqOYOOHhUW2z9prtrtH8hymQyjX-rTxAY0jjU"
    );
    expect(nftState.title).toEqual("rollies #00007");
  });

  it("should get owner nfts", async () => {
    const owner = "IsAUH6ruDQgbhr7SvfYUFzQJO-6MGXaRFfJ0FIyHvOQ";
    const nfts = await ktools.getNftIdsByOwner(owner);
    expect(nfts.length).toBeGreaterThan(3);
  });

  it("should get NFT reward", async () => {
    jest.setTimeout(60000);
    const reward = await ktools.getNftReward(
      "1UDe0Wqh51-O03efPzoc_HhsUPrmgBR2ziUfaI7CpZk"
    );
    //expect(reward).toBeGreaterThanOrEqual(0);
    expect(reward).toBeGreaterThan(1600);
  });

  it("should get Views And Earned KOII", async () => {
    const NFT_ID_ARR = [
      "Vh-o7iOqOYOOHhUW2z9prtrtH8hymQyjX-rTxAY0jjU",
      "9FD54GbueDjQ1_wXgBEkLVtmaMQxdM23CIysMaAh8ng"
    ];
    const view = await ktools.getViewsAndEarnedKOII(NFT_ID_ARR);

    //expect(view.totalViews).toBeGreaterThanOrEqual(0);
    expect(view.totalViews).toBeGreaterThan(11000);
  });

  it("should get attentionId", async () => {
    jest.setTimeout(60000);
    const attentionId = await ktools.getAttentionId();
    expect(typeof attentionId).toEqual("string");
    expect(attentionId.length).toEqual(43);
  });

  // it("should generate mnemonic", async () => {
  //   jest.setTimeout(600000);
  //   expect(await ktools.generateWallet(true)).toBeTruthy();
  // });
});
