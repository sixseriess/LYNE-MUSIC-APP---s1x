import { describe, expect, it } from "vitest";
import { findDeeplinkArg, parseDeeplink } from "./deeplink";

describe("parseDeeplink", () => {
  it("accepts legacy Liner links without registering that scheme for LYNE", () => {
    expect(parseDeeplink("liner://track?id=RGdkabupfPI")).toEqual({
      type: "track",
      id: "RGdkabupfPI",
    });
  });

  it("accepts real share targets", () => {
    expect(parseDeeplink("lyne://artist?id=UCGtGpOIGHfRu1KYL9pi-mNQ")).toEqual(
      {
        type: "artist",
        id: "UCGtGpOIGHfRu1KYL9pi-mNQ",
      },
    );
    expect(parseDeeplink("lyne://album?id=MPREb_xCxkOKReFZv")).toEqual({
      type: "album",
      id: "MPREb_xCxkOKReFZv",
    });
    expect(
      parseDeeplink("lyne://playlist?id=VLPLD8jNKEyHYB2DHh5vXSI4USLFo29vzUYl"),
    ).toEqual({ type: "playlist", id: "VLPLD8jNKEyHYB2DHh5vXSI4USLFo29vzUYl" });
    expect(parseDeeplink("lyne://track?id=RGdkabupfPI")).toEqual({
      type: "track",
      id: "RGdkabupfPI",
    });
  });

  it("accepts artist names used when a track has no channel id", () => {
    expect(parseDeeplink("lyne://artist?id=LATIN%20MAFIA")).toEqual({
      type: "artist",
      id: "LATIN MAFIA",
    });
  });

  it("rejects smuggled urls", () => {
    expect(parseDeeplink("https://evil.com")).toBeNull();
    expect(parseDeeplink("javascript:alert(1)")).toBeNull();
    expect(parseDeeplink("lyne://artist?id=LATIN%20MAFIA%0A")).toBeNull();
    expect(
      parseDeeplink("lyne://artist?id=UCaaaaaaaaaaaaaaaaaaaaaa&x=1&y=2"),
    ).toEqual({
      type: "artist",
      id: "UCaaaaaaaaaaaaaaaaaaaaaa",
    });
    expect(
      parseDeeplink(
        "lyne://artist?id=UCaaaaaaaaaaaaaaaaaaaaaa&id=UCbbbbbbbbbbbbbbbbbbbbbb",
      ),
    ).toBeNull();
    expect(parseDeeplink("lyne://artist")).toBeNull();
    expect(parseDeeplink("lyne://evil?id=RGdkabupfPI")).toBeNull();
    expect(parseDeeplink("lyne://track?id=RGdkabupfPIextra")).toBeNull();
    expect(
      parseDeeplink("lyne://artist?id=ABaaaaaaaaaaaaaaaaaaaaaa"),
    ).toBeNull();
    expect(parseDeeplink("lyne://artist?id=UCaaa/../../../../etc")).toBeNull();
    expect(parseDeeplink("not a url")).toBeNull();
  });

  it("finds the deeplink arg anywhere in argv", () => {
    expect(
      findDeeplinkArg(["/usr/bin/lyne", "lyne://track?id=RGdkabupfPI"]),
    ).toBe("lyne://track?id=RGdkabupfPI");
    expect(findDeeplinkArg(["/usr/bin/liner", "--no-sandbox"])).toBeUndefined();
  });
});
