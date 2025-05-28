import { canonicalize } from "@tufjs/canonical-json";
import { createHash } from "crypto";

export const canonizeJsonDocument = async (
  document: object
): Promise<string> => {
  return canonicalize(document);
};

export const hashData = async (
  data: string,
  bits: 256 | 384 | 512 = 256
): Promise<Uint8Array> => {
  return createHash(`sha${bits}`).update(data).digest();
};
