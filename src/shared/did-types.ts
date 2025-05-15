export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  [key: string]: any;
}

type KeyCapabilityMethod = string | VerificationMethod;

export interface JsonLdDIDDocument {
  "@context": string | string[];
  id: string;
  controller: string | string[];
  verificationMethod?: VerificationMethod[];
  authentication?: KeyCapabilityMethod[];
  assertionMethod?: KeyCapabilityMethod[];
  keyAgreement?: KeyCapabilityMethod[];
  capabilityInvocation?: KeyCapabilityMethod[];
  capabilityDelegation?: KeyCapabilityMethod[];
}
