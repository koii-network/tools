"use strict";

import * as kcommon from "../src/web";
const ktools = new kcommon.Web();

test("My content", async () => {
  jest.setTimeout(60000);
  ktools.setWallet("WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc");
  const myNfts = await ktools.myContent();
  expect(myNfts.length).toBeGreaterThan(7);
});
