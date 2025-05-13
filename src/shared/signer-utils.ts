import { canonicalize } from "@tufjs/canonical-json";
import { createHash } from "crypto";

export const canonizeJsonDocument = async (
  document: object
): Promise<string> => {
  return canonicalize(document);
};

export const hashData = async (data: string): Promise<Uint8Array> => {
  return createHash("sha256").update(data).digest();
};
