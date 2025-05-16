import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { TopicReaderHederaClient } from "@swiss-digital-assets-institute/resolver";
import { InternalEd25519Verifier } from "./ed25519-verifier";
import { JsonLdDIDDocument, VerificationMethod } from "./did-types";
import { Proof, SecuredDataDocument } from "./signer-types";

interface ResolveDidArgs {
  did: string;
}

export async function resolveDid({ did }: ResolveDidArgs) {
  const resolver = new DidResolver(did);
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

  private previousDidDocument: JsonLdDIDDocument | null = null;

  constructor(did: string) {
    this.did = did;
    this.topicId = did.split("_")[1];
    this.topicReader = new TopicReaderHederaClient();
  }

  async resolve() {
    // wait for 10s to ensure messages are available
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const messages = await this.topicReader.fetchAllToDate(
      this.topicId,
      "testnet"
    );

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
    const { controller } = document;
    const { verificationMethod } = message.proof;
    const verificationMethodDid = verificationMethod.split("#")[0];

    if (!controller.includes(verificationMethodDid)) {
      return null;
    }

    let foundedVerificationMethod: VerificationMethod | null = null;

    // Self-controlled document
    if (verificationMethodDid === this.did) {
      // find the verification method in the document
      foundedVerificationMethod = this.findVerificationMethod(
        document,
        verificationMethod
      );
    } else {
      // Controlled by 3rd party
      const resolvedController = await resolveDid({
        did: verificationMethodDid,
      });

      if (!resolvedController) return null;

      foundedVerificationMethod = this.findVerificationMethod(
        resolvedController,
        verificationMethod
      );
    }

    if (!foundedVerificationMethod) return null;

    let publicKeyEntry: any;

    if (
      foundedVerificationMethod.type === "Ed25519VerificationKey2020" &&
      foundedVerificationMethod.publicKeyMultibase
    ) {
      publicKeyEntry = KeysUtility.fromMultibase(
        foundedVerificationMethod.publicKeyMultibase
      ).toDerString();
    } else if (
      foundedVerificationMethod.type === "JsonWebKey2020" &&
      foundedVerificationMethod.publicKeyJwk
    ) {
      publicKeyEntry = foundedVerificationMethod.publicKeyJwk;
    } else {
      throw new Error("Invalid verification method");
    }

    const verifier = new InternalEd25519Verifier(publicKeyEntry);
    const { verified, verifiedDocument } = await verifier.verifyProof(
      message as unknown as SecuredDataDocument
    );

    if (!verified || !verifiedDocument) return null;

    return {
      verified,
      document: verifiedDocument["didDocument"] as unknown as JsonLdDIDDocument,
    };
  }

  private findVerificationMethod(
    didDocument: JsonLdDIDDocument,
    verificationMethodId: string
  ): VerificationMethod | null {
    for (const vm of didDocument.capabilityInvocation ?? []) {
      if (typeof vm !== "object" || !("id" in vm)) continue;

      if (vm.id === verificationMethodId) return vm;
    }

    return null;
  }
}
