import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { TopicReaderHederaClient } from "@swiss-digital-assets-institute/resolver";
import { InternalEd25519Verifier } from "./ed25519-verifier";
import { inspect } from "util";
import { JsonLdDIDDocument, VerificationMethod } from "./did-types";

interface ResolveDidArgs {
  did: string;
  debug?: boolean;
}

export async function resolveDid({ did, debug }: ResolveDidArgs) {
  const topicId = did.split("_")[1];
  const topicReader = new TopicReaderHederaClient();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const messages = await topicReader.fetchAllToDate(topicId, "testnet");

  let previousDidDocument: JsonLdDIDDocument | null = null;
  let currentDidDocument: JsonLdDIDDocument | null = null;

  for (const message of messages) {
    const parsed = JSON.parse(message);
    const { version, operation, didDocument, proof } = parsed;
    if (version !== "2.0" || !proof) continue;

    let verificationMethodEntry: VerificationMethod | null = null;
    let publicKeyEntry: any = null;

    // For 'create', use the verification method in the current didDocument
    // For 'update', use the verification method in the previous didDocument
    currentDidDocument =
      operation === "create" ? didDocument : previousDidDocument;
    if (!currentDidDocument) throw new Error("No document to check");

    // Find the verification method entry
    const didProperties = Object.keys(currentDidDocument);
    for (const property of didProperties) {
      if (debug) {
        console.log(
          inspect(
            {
              property,
              value: currentDidDocument[property],
              verificationMethod: proof.verificationMethod,
            },
            { depth: null }
          )
        );
      }

      if (property === "service") {
        continue;
      }

      if (!Array.isArray(currentDidDocument[property])) {
        continue;
      }

      const foundVm = currentDidDocument[property].find(
        (vm: VerificationMethod) => {
          return vm.id === proof.verificationMethod;
        }
      );

      if (foundVm) {
        verificationMethodEntry = foundVm;
        break;
      }
    }

    if (!verificationMethodEntry)
      throw new Error("No verification method entry");

    if (
      verificationMethodEntry.type === "Ed25519VerificationKey2020" &&
      verificationMethodEntry.publicKeyMultibase
    ) {
      publicKeyEntry = KeysUtility.fromMultibase(
        verificationMethodEntry.publicKeyMultibase
      ).toDerString();
    } else if (
      verificationMethodEntry.type === "JsonWebKey2020" &&
      verificationMethodEntry.publicKeyJwk
    ) {
      publicKeyEntry = verificationMethodEntry.publicKeyJwk;
    } else {
      throw new Error("Invalid verification method");
    }

    let verifier = new InternalEd25519Verifier(publicKeyEntry);

    // Verify the proof
    const { verified, verifiedDocument } = await verifier.verifyProof(parsed);
    if (!verified || !verifiedDocument)
      throw new Error("Proof verification failed");

    previousDidDocument =
      verifiedDocument.didDocument as unknown as JsonLdDIDDocument;
    currentDidDocument =
      verifiedDocument.didDocument as unknown as JsonLdDIDDocument;
  }
  return currentDidDocument;
}
