import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { InternalEd25519Signer } from "./ed25519-signer";

interface DeactivateDidAndPublishArgs {
  client: Client;
  did: string;
  topicId: string;
  privateKey: PrivateKey;
  verificationMethodId: string;
}

export async function deactivateDidAndPublish({
  client,
  did,
  topicId,
  privateKey,
  verificationMethodId,
}: DeactivateDidAndPublishArgs) {
  const deactivatePayload = {
    version: "2.0",
    operation: "deactivate",
    did,
  };

  const signer = new InternalEd25519Signer(privateKey);
  const signedDeactivatePayload = await signer.createProof(deactivatePayload, {
    proofPurpose: "capabilityInvocation",
    verificationMethod: verificationMethodId,
  });
  const tx = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(Buffer.from(JSON.stringify(signedDeactivatePayload)))
    .execute(client);

  await tx.getReceipt(client);
}
