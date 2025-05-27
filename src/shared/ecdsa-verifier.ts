import { PublicKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import {
  LDContext,
  ProofConfig,
  SecuredDataDocument,
  UnsecuredDocument,
  VerificationResult,
} from "./signer-types";
import { hashData } from "./signer-utils";
import { canonizeJsonDocument } from "./signer-utils";

// https://www.rfc-editor.org/rfc/rfc8037.html
interface EcdsaJWK {
  kty: "EC";
  crv: "P-256" | "P-384" | "P-512";
  alg?: "ECDSA";
  // Public key
  x: string;
  y: string;
  kid?: string;
  key_ops?: Array<"sign" | "verify">;
  use?: "sig";
}

export class InternalECDSAVerifier {
  private publicKey: PublicKey;

  constructor(publicKey: string | PublicKey | EcdsaJWK) {
    if (typeof publicKey === "string") {
      this.publicKey = PublicKey.fromStringECDSA(publicKey);
    } else if (publicKey instanceof PublicKey) {
      if (publicKey["_key"]._type !== "secp256k1") {
        throw new Error("Invalid public key");
      }
      this.publicKey = publicKey;
    } else {
      const xBytes = Buffer.from(publicKey.x, "base64url");
      const yBytes = Buffer.from(publicKey.y, "base64url");
      this.publicKey = PublicKey.fromBytesECDSA(
        Buffer.concat([Buffer.from([0x04]), xBytes, yBytes])
      );
    }
  }

  async verifyProof(
    securedDocument: SecuredDataDocument
  ): Promise<VerificationResult> {
    const unsecuredDocument: UnsecuredDocument =
      structuredClone(securedDocument);
    delete unsecuredDocument.proof;

    const proofOptions: ProofConfig & { proofValue?: string } = structuredClone(
      securedDocument.proof
    );
    delete proofOptions.proofValue;

    const proofBytes = KeysUtility.fromMultibase(
      securedDocument.proof.proofValue
    ).toBytes();

    if (proofOptions["@context"]) {
      const proofContext = Array.isArray(proofOptions["@context"])
        ? proofOptions["@context"]
        : [proofOptions["@context"]];

      const docContext = Array.isArray(securedDocument["@context"])
        ? securedDocument["@context"]
        : [securedDocument["@context"] || []];

      const isValidContext = proofContext.every(
        (ctx, index) => docContext[index] === ctx
      );
      if (!isValidContext) {
        return {
          verified: false,
          verifiedDocument: null,
        };
      }

      unsecuredDocument["@context"] = proofOptions["@context"] as LDContext;
    }

    const canonicalProofConfig = await canonizeJsonDocument(proofOptions);
    const canonicalDocument = await canonizeJsonDocument(unsecuredDocument);

    // Should be based on key size: 256 or 384
    const canonicalProofConfigHash = await hashData(canonicalProofConfig, 256);
    const canonicalDocumentHash = await hashData(canonicalDocument, 256);

    const hashedData = Buffer.concat([
      canonicalDocumentHash,
      canonicalProofConfigHash,
    ]);

    const verified = this.publicKey.verify(hashedData, proofBytes);

    return {
      verified,
      verifiedDocument: verified ? unsecuredDocument : null,
    };
  }
}
