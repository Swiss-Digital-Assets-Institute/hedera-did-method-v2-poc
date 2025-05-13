import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { InternalEd25519Signer } from "./ed25519-signer";
import { JsonLdDIDDocument } from "./did-types";

interface UpdateDidAndPublishArgs {
  client: Client;
  did: string;
  topicId: string;
  privateKey: PrivateKey;
  verificationMethodId: string;
  didDocument: JsonLdDIDDocument;
  updateFn: (doc: JsonLdDIDDocument) => JsonLdDIDDocument;
}

export async function updateDidAndPublish({
  client,
  did,
  topicId,
  privateKey,
  verificationMethodId,
  didDocument,
  updateFn,
}: UpdateDidAndPublishArgs) {
  const updatedDidDocument = updateFn({ ...didDocument });
  const updatePayload = {
    version: "2.0",
    operation: "update",
    did,
    didDocument: updatedDidDocument,
  };

  const signer = new InternalEd25519Signer(privateKey);
  const signedUpdatePayload = await signer.createProof(updatePayload, {
    proofPurpose: "capabilityInvocation",
    verificationMethod: verificationMethodId,
  });
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(Buffer.from(JSON.stringify(signedUpdatePayload)))
    .execute(client);

  await tx.getReceipt(client);

  return updatedDidDocument;
}
