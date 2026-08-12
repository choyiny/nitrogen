import { encodeDoc, decodeDoc, readDocFromHash, writeDocToHash } from "./shareLink";
import { emptyDoc, seedDoc, addBlock } from "./docStore";

test("encode → decode round-trips a doc", () => {
  const doc = addBlock(seedDoc(), 0, "bash", "z1");
  expect(decodeDoc(encodeDoc(doc))).toEqual(doc);
});

test("encodeDoc output is URL-safe (base64url, no +/=)", () => {
  const s = encodeDoc(seedDoc());
  expect(s).not.toMatch(/[+/=]/);
});

test("decodeDoc returns null on junk / empty / wrong shape", () => {
  expect(decodeDoc("")).toBeNull();
  expect(decodeDoc("not-base64-@@@")).toBeNull();
  expect(decodeDoc("YWJjZA")).toBeNull(); // valid base64, not a deflate stream
});

test("writeDocToHash then readDocFromHash round-trips via location.hash", () => {
  const doc = addBlock(emptyDoc(), 1, "read", "r1");
  writeDocToHash(doc);
  expect(location.hash.startsWith("#s=")).toBe(true);
  expect(readDocFromHash()).toEqual(doc);
  location.hash = "";
});

test("readDocFromHash returns null with no hash", () => {
  location.hash = "";
  expect(readDocFromHash()).toBeNull();
});
