import { deflate, inflate } from "pako";
import { Doc } from "./types";

function u8ToBinary(u8: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    s += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return s;
}

function binaryToU8(bin: string): Uint8Array {
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function toBase64Url(u8: Uint8Array): string {
  return btoa(u8ToBinary(u8)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  return binaryToU8(atob(padded));
}

function isDoc(x: unknown): x is Doc {
  const d = x as Doc;
  return !!d && Array.isArray(d.windows) && d.windows.length === 2 && !!d.frame;
}

export function encodeDoc(doc: Doc): string {
  return toBase64Url(deflate(JSON.stringify(doc)));
}

export function decodeDoc(s: string): Doc | null {
  try {
    const compressed = fromBase64Url(s);
    const json = new TextDecoder().decode(inflate(compressed));
    const parsed = JSON.parse(json);
    return isDoc(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readDocFromHash(): Doc | null {
  const m = /[#&]s=([^&]+)/.exec(window.location.hash);
  return m ? decodeDoc(m[1]) : null;
}

export function writeDocToHash(doc: Doc): void {
  try {
    window.history.replaceState(null, "", "#s=" + encodeDoc(doc));
  } catch {
    /* ignore */
  }
}
