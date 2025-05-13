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
interface Ed25519JWK {
  kty: "OKP";
  crv: "Ed25519";
  alg?: "EdDSA";
  // Public key
  x: string;
  kid?: string;
  key_ops?: Array<"sign" | "verify">;
  use?: "sig";
}

export class InternalEd25519Verifier {
  private publicKey: PublicKey;

  constructor(publicKey: string | PublicKey | Ed25519JWK) {
    if (typeof publicKey === "string") {
      this.publicKey = PublicKey.fromStringED25519(publicKey);
    } else if (publicKey instanceof PublicKey) {
      this.publicKey = publicKey;
    } else {
      this.publicKey = PublicKey.fromBytesED25519(
        Buffer.from(publicKey.x, "base64url")
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

    const canonicalProofConfigHash = await hashData(canonicalProofConfig);
    const canonicalDocumentHash = await hashData(canonicalDocument);

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
