import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { resolveDid } from "./shared/resolver";
import { createDidAndPublish } from "./shared/create-did";
import { deactivateDidAndPublish } from "./shared/deactivate-did";
import assert from "assert";

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  // Create 3 controllers
  const controllers: {
    did: string;
    privateKey: PrivateKey;
    publicKeyMultibase: string;
  }[] = [];
  for (let i = 0; i < 3; i++) {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    const publicKeyMultibase = KeysUtility.fromBytes(
      publicKey.toBytesRaw()
    ).toMultibase();
    controllers.push({
      did: undefined as any, // will be set after creation
      privateKey,
      publicKeyMultibase,
    });
  }

  // Publish controller DIDs
  for (const c of controllers) {
    const { did } = await createDidAndPublish({
      client,
      privateKey: c.privateKey,
      partialDidDocument: (did) => ({
        capabilityInvocation: [
          {
            id: `${did}#auth`,
            type: "Ed25519VerificationKey2020",
            controller: did,
            publicKeyMultibase: c.publicKeyMultibase,
          },
        ],
      }),
      verificationMethodId: (did) => `${did}#auth`,
    });
    c.did = did;
  }

  // Create a DID with all controllers
  const mainPrivateKey = controllers[0].privateKey;
  const { did, topicId } = await createDidAndPublish({
    client,
    privateKey: mainPrivateKey,
    controllers: controllers.map((c) => c.did),
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: controllers[0].publicKeyMultibase,
        },
      ],
    }),
    verificationMethodId: (did) => `${controllers[0].did}#auth`,
  });

  // Deactivate DID using the second controller
  await deactivateDidAndPublish({
    client,
    did,
    topicId,
    privateKey: controllers[1].privateKey,
    verificationMethodId: `${controllers[1].did}#auth`,
  });

  // Assert deactivated
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
