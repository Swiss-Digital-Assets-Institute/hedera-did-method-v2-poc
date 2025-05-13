import { PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { InternalEd25519Verifier } from "./ed25519-verifier";
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
interface Ed25519JWK {
  kty: "OKP";
  crv: "Ed25519";
  alg?: "EdDSA";
  // Public key
  x: string;
  // Private key
  d?: string;
  kid?: string;
  key_ops?: Array<"sign" | "verify">;
  use?: "sig";
}

/**
 * InternalEd25519Signer is a class that implements the Data Integrity EdDSA Cryptosuites v1.0 for the Ed25519 algorithm.
 *
 * @see https://www.w3.org/TR/vc-di-eddsa/
 */
export class InternalEd25519Signer extends InternalEd25519Verifier {
  private key: PrivateKey;

  constructor(privateKey: string | PrivateKey | Ed25519JWK) {
    let key: PrivateKey;
    if (typeof privateKey === "string") {
      key = PrivateKey.fromStringED25519(privateKey);
    } else if (privateKey instanceof PrivateKey) {
      key = privateKey;
    } else if (privateKey.d) {
      key = PrivateKey.fromBytesED25519(Buffer.from(privateKey.d, "base64url"));
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
      cryptosuite: "eddsa-jcs-2022",
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

    const canonicalProofConfigHash = await hashData(canonicalProofConfig);
    const canonicalDocumentHash = await hashData(canonicalDocument);

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
