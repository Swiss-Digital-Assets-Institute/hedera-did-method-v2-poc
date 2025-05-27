import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { resolveDid } from "./shared/resolver";
import { createDidAndPublish } from "./shared/create-did";
import { deactivateDidAndPublish } from "./shared/deactivate-did";
import assert from "assert";
import { InternalEd25519Signer } from "./shared/ed25519-signer";

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  const privateKey = PrivateKey.generateED25519();
  const publicKey = privateKey.publicKey;
  const publicKeyMultibase = KeysUtility.fromBytes(
    publicKey.toBytesRaw()
  ).toMultibase();

  // 1. Create DID
  const { did, topicId } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(privateKey),
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#auth`,
  });

  // 2. Deactivate DID
  await deactivateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(privateKey),
    verificationMethodId: `${did}#auth`,
  });

  // 3. Assert deactivated
  const didState = await resolveDid({ did });
  assert.deepStrictEqual(didState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    controller: [],
  });

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", did);
  console.log("Topic ID: ", topicId);
  console.log("Deactivated state: ", didState);
  client.close();
}

run();
