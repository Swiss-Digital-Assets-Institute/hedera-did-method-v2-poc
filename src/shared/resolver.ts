import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { TopicReaderHederaClient } from "@swiss-digital-assets-institute/resolver";
import { JsonLdDIDDocument, VerificationMethod } from "./did-types";
import { InternalECDSAVerifier } from "./ecdsa-verifier";
import { InternalEd25519Verifier } from "./ed25519-verifier";
import { Proof, SecuredDataDocument, Verifier } from "./signer-types";

interface ResolveDidArgs {
  did: string;
  versionTime?: string;
}

export async function resolveDid({ did, versionTime }: ResolveDidArgs) {
  const resolver = new DidResolver(did, versionTime);
  return resolver.resolve();
}

interface ParsedMessage {
  version: string;
  operation: string;
  did: string;
  didDocument: JsonLdDIDDocument;
  proof: Proof;
}

class DidResolver {
  private readonly did: string;
  private readonly topicId: string;
  private readonly topicReader: TopicReaderHederaClient;
  private readonly versionTime?: string;

  private previousDidDocument: JsonLdDIDDocument | null = null;

  constructor(did: string, versionTime?: string) {
    this.did = did;
    this.topicId = did.split("_")[1];
    this.topicReader = new TopicReaderHederaClient();
    this.versionTime = versionTime;
  }

  async resolve() {
    // wait for 10s to ensure messages are available
    await new Promise((r) => setTimeout(r, 10000));

    let messages = this.versionTime
      ? await this.topicReader.fetchFrom(this.topicId, "testnet", {
          from: 0,
          to: new Date(this.versionTime).getTime(),
        })
      : await this.topicReader.fetchAllToDate(this.topicId, "testnet");

    for (const message of messages) {
      const parsed = this.parseMessage(message);
      if (!parsed) continue;

      const { operation } = parsed;

      if (operation === "create") {
        const verifiedDocument = await this.processCreate(parsed);
        if (verifiedDocument) this.previousDidDocument = verifiedDocument;
      } else if (operation === "update") {
        const verifiedDocument = await this.processUpdate(parsed);
        if (verifiedDocument) this.previousDidDocument = verifiedDocument;
      } else if (operation === "deactivate") {
        const verifiedDocument = await this.processDeactivate(parsed);
        if (verifiedDocument) this.previousDidDocument = verifiedDocument;
        break;
      }
    }

    return this.previousDidDocument;
  }

  private parseMessage(message: string) {
    const parsed: ParsedMessage = JSON.parse(message);

    const { version, operation, proof } = parsed;
    if (version !== "2.0" || !proof) return null;

    if (operation === "create" && this.previousDidDocument) {
      return;
    }

    if (operation === "update" && !this.previousDidDocument) {
      return;
    }

    if (this.did !== parsed.did) {
      return;
    }

    return parsed;
  }

  private async processCreate(
    parsed: ParsedMessage
  ): Promise<JsonLdDIDDocument | null> {
    const { didDocument } = parsed;

    const verifiedDocument = await this.verifyProof(parsed, didDocument);
    if (!verifiedDocument) return null;

    return verifiedDocument.document;
  }

  private async processUpdate(
    parsed: ParsedMessage
  ): Promise<JsonLdDIDDocument | null> {
    if (!this.previousDidDocument) return null;

    const verifiedDocument = await this.verifyProof(
      parsed,
      this.previousDidDocument
    );
    if (!verifiedDocument) return null;

    return verifiedDocument.document;
  }

  private async processDeactivate(
    parsed: ParsedMessage
  ): Promise<JsonLdDIDDocument | null> {
    if (!this.previousDidDocument) return null;

    const result = await this.verifyProof(parsed, this.previousDidDocument);
    if (!result || !result.verified) return null;

    return {
      "@context": this.previousDidDocument["@context"],
      id: this.did,
      controller: [],
    };
  }

  private async verifyProof(
    message: ParsedMessage,
    document: JsonLdDIDDocument
  ): Promise<{ verified: boolean; document: JsonLdDIDDocument } | null> {
    const { verificationMethod } = message.proof;
    const verificationMethodDid = verificationMethod.split("#")[0];

    let didDocumentToSearch = document;

    if (verificationMethodDid !== this.did) {
      if (!document.controller.includes(verificationMethodDid)) {
        return null;
      }

      if (!document.capabilityInvocation?.includes(verificationMethod)) {
        return null;
      }

      const proofTimestamp = new Date(message.proof.created).getTime();
      const resolvedControllerDoc = await resolveDid({
        did: verificationMethodDid,
        versionTime: new Date(proofTimestamp).toISOString(),
      });

      if (!resolvedControllerDoc) {
        return null;
      }

      didDocumentToSearch = resolvedControllerDoc;
    }

    const foundedVerificationMethod = this.findVerificationMethod(
      didDocumentToSearch,
      verificationMethod
    );

    if (!foundedVerificationMethod) {
      return null;
    }

    // Check if the verification method is from one of the DID controllers
    if (
      !didDocumentToSearch.controller.includes(
        foundedVerificationMethod.controller
      )
    ) {
      return null;
    }

    let verifier: Verifier;

    if (
      foundedVerificationMethod.type === "Ed25519VerificationKey2020" &&
      foundedVerificationMethod.publicKeyMultibase
    ) {
      verifier = new InternalEd25519Verifier(
        KeysUtility.fromMultibase(
          foundedVerificationMethod.publicKeyMultibase
        ).toPublicKey()
      );
    } else if (
      foundedVerificationMethod.type === "JsonWebKey2020" &&
      foundedVerificationMethod.publicKeyJwk
    ) {
      if (foundedVerificationMethod.publicKeyJwk.kty === "EC") {
        verifier = new InternalECDSAVerifier(
          foundedVerificationMethod.publicKeyJwk as any
        );
      } else if (foundedVerificationMethod.publicKeyJwk.kty === "OKP") {
        verifier = new InternalEd25519Verifier(
          foundedVerificationMethod.publicKeyJwk as any
        );
      } else {
        throw new Error("Invalid verification method");
      }
    } else if (
      foundedVerificationMethod.type === "Multikey" &&
      foundedVerificationMethod.publicKeyMultibase
    ) {
      verifier = new InternalECDSAVerifier(
        KeysUtility.fromMultibase(
          foundedVerificationMethod.publicKeyMultibase
        ).toPublicKey()
      );
    } else {
      throw new Error("Invalid verification method");
    }

    const { verified, verifiedDocument } = await verifier.verifyProof(
      message as unknown as SecuredDataDocument
    );

    if (!verified || !verifiedDocument) {
      return null;
    }

    return {
      verified,
      document: verifiedDocument["didDocument"] as unknown as JsonLdDIDDocument,
    };
  }

  private findVerificationMethod(
    didDocument: JsonLdDIDDocument,
    verificationMethodId: string,
    key: "verificationMethod" | "capabilityInvocation" = "capabilityInvocation"
  ): VerificationMethod | null {
    for (const vm of didDocument[key] ?? []) {
      if (typeof vm === "string" && vm === verificationMethodId) {
        return this.findVerificationMethod(
          didDocument,
          verificationMethodId,
          "verificationMethod"
        );
      }

      if (typeof vm !== "object" || !("id" in vm)) continue;

      if (vm.id === verificationMethodId) return vm;
    }

    return null;
  }
}
