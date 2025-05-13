export type ProofPurpose =
  | "authentication"
  | "assertionMethod"
  | "keyAgreement"
  | "capabilityDelegation"
  | "capabilityInvocation";

export interface Proof {
  type: string;
  created: string;
  proofPurpose: ProofPurpose;
  verificationMethod: string;
  proofValue: string;
  cryptosuite?: string;
  expires?: string;
  domain?: string;
  challenge?: string;
  [key: string]: unknown;
}

export type LDContext = string | string[];

export interface InputDocument {
  "@context"?: LDContext;
  [key: string]: unknown;
}

export interface SecuredDataDocument extends InputDocument {
  proof: Proof;
}

export interface ProofOptions {
  proofPurpose: ProofPurpose;
  verificationMethod: string;
  expires?: string;
  domain?: string;
  challenge?: string;
}

export interface ProofConfig extends ProofOptions {
  type: string;
  cryptosuite?: string;
  created: string;
}

export interface VerificationResult {
  verified: boolean;
  verifiedDocument: UnsecuredDocument | null;
}

export type UnsecuredDocument = InputDocument;

export abstract class Verifier {
  abstract verifyProof(
    securedDocument: SecuredDataDocument
  ): Promise<VerificationResult>;
}

export abstract class Signer extends Verifier {
  abstract createProof(
    inputDocument: InputDocument,
    proofOptions: ProofOptions
  ): Promise<SecuredDataDocument>;
}
