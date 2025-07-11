import { Client, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { Signer } from "./signer-types";

interface DeactivateDidAndPublishArgs {
  client: Client;
  did: string;
  topicId: string;
  signer: Signer;
  verificationMethodId: string;
}

export async function deactivateDidAndPublish({
  client,
  did,
  topicId,
  signer,
  verificationMethodId,
}: DeactivateDidAndPublishArgs) {
  const deactivatePayload = {
    version: "2.0",
    operation: "deactivate",
    did,
  };

  const signedDeactivatePayload = await signer.createProof(deactivatePayload, {
    proofPurpose: "capabilityInvocation",
    verificationMethod: verificationMethodId,
  });
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(Buffer.from(JSON.stringify(signedDeactivatePayload)))
    .execute(client);

  const submitReceipt = await tx.getReceipt(client);

  return {
    versionTime: signedDeactivatePayload.proof.created,
    versionId: submitReceipt.topicSequenceNumber?.toString(),
  };
}
