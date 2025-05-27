import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { JsonLdDIDDocument } from "./did-types";
import { Signer } from "./signer-types";

interface UpdateDidAndPublishArgs {
  client: Client;
  did: string;
  topicId: string;
  signer: Signer;
  verificationMethodId: string;
  didDocument: JsonLdDIDDocument;
  updateFn: (doc: JsonLdDIDDocument) => JsonLdDIDDocument;
}

export async function updateDidAndPublish({
  client,
  did,
  topicId,
  signer,
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
