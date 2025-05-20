import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import {
  KeysUtility,
  RelationShipProperties,
  Service,
} from "@swiss-digital-assets-institute/core";
import { InternalEd25519Signer } from "./ed25519-signer";
import { JsonLdDIDDocument, VerificationMethod } from "./did-types";

interface CreateDidAndPublishArgs {
  client: Client;
  privateKey: PrivateKey;
  controllers?: string[];
  verificationMethodId: (did: string) => string;
  partialDidDocument: (did: string) => Partial<
    Record<RelationShipProperties, (VerificationMethod | string)[]> & {
      verificationMethod: VerificationMethod[];
      service: Service[];
    }
  >;
}

export async function createDidAndPublish({
  client,
  privateKey,
  controllers,
  partialDidDocument,
  verificationMethodId,
}: CreateDidAndPublishArgs) {
  const identifierPrivateKey = PrivateKey.generateED25519();
  const identifierBase58btcKey = KeysUtility.fromPublicKey(
    identifierPrivateKey.publicKey
  ).toBase58();

  const topicTx = await new TopicCreateTransaction()
    .setTopicMemo("DID v2 PoC")
    .execute(client);
  const topicReceipt = await topicTx.getReceipt(client);
  const topicId = topicReceipt.topicId?.toString();

  if (!topicId) {
    throw new Error("Failed to create topic");
  }

  const network = "testnet";
  const did = `did:hedera:${network}:${identifierBase58btcKey}_${topicId}`;

  const didDocument: JsonLdDIDDocument = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    controller: controllers ?? [did],
    ...partialDidDocument(did),
  };

  const createPayload = {
    version: "2.0",
    operation: "create",
    did,
    didDocument,
  };
  const signer = new InternalEd25519Signer(privateKey);
  const signedCreatePayload = await signer.createProof(createPayload, {
    proofPurpose: "capabilityInvocation",
    verificationMethod: verificationMethodId(did),
  });

  const submitTx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(Buffer.from(JSON.stringify(signedCreatePayload)))
    .execute(client);
  await submitTx.getReceipt(client);

  return {
    did,
    topicId,
    didDocument,
  };
}
