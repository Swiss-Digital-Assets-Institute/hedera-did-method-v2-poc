export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: {
    kty: string;
    use?: "sig" | "enc";
    crv?: string;
    kid?: string;
    key_ops?: Array<
      | "sign"
      | "verify"
      | "encrypt"
      | "decrypt"
      | "wrapKey"
      | "unwrapKey"
      | "deriveKey"
      | "deriveBits"
    >;

    [key: string]: any;
  };
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
  [key: string]: any;
}

export interface Service {
  id: string;
  type: string | string[];
  serviceEndpoint:
    | string
    | string[]
    | Record<string, any>
    | Array<Record<string, any>>;
  [key: string]: any;
}

type KeyCapabilityMethod = string | VerificationMethod;

export interface JsonLdDIDDocument {
  "@context": string | string[];
  id: string;
  controller: string | string[];
  alsoKnownAs?: string[];
  verificationMethod?: VerificationMethod[];
  authentication?: KeyCapabilityMethod[];
  assertionMethod?: KeyCapabilityMethod[];
  keyAgreement?: KeyCapabilityMethod[];
  capabilityInvocation?: KeyCapabilityMethod[];
  capabilityDelegation?: KeyCapabilityMethod[];
  service?: Service[];
  [key: string]: any;
}
