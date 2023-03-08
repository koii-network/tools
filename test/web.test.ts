import { Web } from "../src/web";

describe("Web class", () => {
  let kweb: Web;

  beforeAll(() => {
    kweb = new Web();
  });

  //FIXME: Results in "Maximum call stack size exceeded" error caused by @vespaiach/axios-fetch-adapter
  //   it("should fetch my content", async () => {
  //     kweb.setWallet("WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc");
  //     const myNfts = await kweb.myContent();
  //     expect(myNfts.length).toBeGreaterThan(7);
  //   });

  it("stub", async () => {
    expect(true);
  });
});
