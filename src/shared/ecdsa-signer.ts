import { PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { InternalECDSAVerifier } from "./ecdsa-verifier";
import {
  InputDocument,
  Proof,
  ProofConfig,
  ProofOptions,
  SecuredDataDocument,
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
  // Private key
  d?: string;
  kid?: string;
  key_ops?: Array<"sign" | "verify">;
  use?: "sig";
}

/**
 * InternalECDSASigner is a class that implements the Data Integrity ECDSA Cryptosuites v1.0 for the ECDSA algorithm.
 *
 * @see https://www.w3.org/TR/vc-di-ecdsa/
 */
export class InternalECDSASigner extends InternalECDSAVerifier {
  private key: PrivateKey;

  constructor(privateKey: string | PrivateKey | EcdsaJWK) {
    let key: PrivateKey;
    if (typeof privateKey === "string") {
      key = PrivateKey.fromStringECDSA(privateKey);
    } else if (privateKey instanceof PrivateKey) {
      // We should only support P-256 or P-384, not support by @hashgraph/sdk
      if (privateKey["_key"]._type !== "secp256k1") {
        throw new Error("Invalid private key");
      }
      key = privateKey;
    } else if (privateKey.d) {
      key = PrivateKey.fromBytesECDSA(Buffer.from(privateKey.d, "base64url"));
    } else {
      throw new Error("Invalid private key");
    }

    super(key.publicKey);
    this.key = key;
  }

  async createProof(
    inputDocument: InputDocument,
    proofOptions: ProofOptions
  ): Promise<SecuredDataDocument> {
    const proofConfig: ProofConfig = {
      type: "DataIntegrityProof",
      cryptosuite: "ecdsa-jcs-2019",
      created: new Date().toISOString(),
      proofPurpose: proofOptions.proofPurpose,
      verificationMethod: proofOptions.verificationMethod,
    };

    if (inputDocument["@context"]) {
      proofConfig["@context"] = inputDocument["@context"];
    }

    if (proofOptions.expires) {
      proofConfig.expires = proofOptions.expires;
    }
    if (proofOptions.domain) {
      proofConfig.domain = proofOptions.domain;
    }
    if (proofOptions.challenge) {
      proofConfig.challenge = proofOptions.challenge;
    }

    const canonicalProofConfig = await canonizeJsonDocument(proofConfig);
    const canonicalDocument = await canonizeJsonDocument(inputDocument);

    // Should be based on key size: 256 or 384
    const canonicalProofConfigHash = await hashData(canonicalProofConfig, 256);
    const canonicalDocumentHash = await hashData(canonicalDocument, 256);

    const hashedData = Buffer.concat([
      canonicalDocumentHash,
      canonicalProofConfigHash,
    ]);

    const proofBytes = this.key.sign(hashedData);
    const proofValue =
      KeysUtility.fromBytes(proofBytes).toMultibase("base58btc");

    const proof: Proof = {
      ...proofConfig,
      proofValue,
    };

    return {
      ...inputDocument,
      proof,
    };
  }
}
