import { composeUrl } from "./composeUrl";

describe("compose paths and urls", () => {
  it("should handle with absolute path", () => {
    const path = "/absolute";

    const base = "https://my-awesome-api.fake";
    expect(composeUrl(base, "", path)).toBe("https://my-awesome-api.fake/absolute");

    const baseWithSubpath = "https://my-awesome-api.fake/MY_SUBROUTE";
    expect(composeUrl(baseWithSubpath, "", path)).toBe("https://my-awesome-api.fake/MY_SUBROUTE/absolute");
  });
});
