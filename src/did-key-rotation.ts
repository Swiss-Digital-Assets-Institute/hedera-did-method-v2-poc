import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import assert from "assert";
import { createDidAndPublish } from "./shared/create-did";
import { InternalEd25519Signer } from "./shared/ed25519-signer";
import { resolveDid } from "./shared/resolver";
import { updateDidAndPublish } from "./shared/update-did";

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  const authPrivateKey1 = PrivateKey.generateED25519();
  const authPublicKeyMultibase1 = KeysUtility.fromPublicKey(
    authPrivateKey1.publicKey
  ).toMultibase();

  const authPrivateKey2 = PrivateKey.generateED25519();
  const authPublicKeyMultibase2 = KeysUtility.fromPublicKey(
    authPrivateKey2.publicKey
  ).toMultibase();

  // 1. Create DID
  const { did, topicId } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(authPrivateKey1),
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: authPublicKeyMultibase1,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#auth`,
  });

  const firstDidState = await resolveDid({ did });
  assert.deepStrictEqual(firstDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    controller: [did],
    capabilityInvocation: [
      {
        id: `${did}#auth`,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyMultibase: authPublicKeyMultibase1,
      },
    ],
  });

  // 2. Rotate #auth verification method
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(authPrivateKey1),
    verificationMethodId: `${did}#auth`,
    didDocument: firstDidState,
    updateFn: (doc) => {
      return {
        ...doc,
        capabilityInvocation: [
          {
            id: `${did}#auth`,
            type: "Ed25519VerificationKey2020",
            controller: did,
            publicKeyMultibase: authPublicKeyMultibase2,
          },
        ],
      };
    },
  });

  const secondDidState = await resolveDid({ did });
  assert.deepStrictEqual(secondDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    controller: [did],
    capabilityInvocation: [
      {
        id: `${did}#auth`,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyMultibase: authPublicKeyMultibase2,
      },
    ],
  });

  // 3. Make an update with the new key
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(authPrivateKey2),
    verificationMethodId: `${did}#auth`,
    didDocument: secondDidState,
    updateFn: (doc) => {
      return {
        ...doc,
        service: [
          {
            id: `${did}#service`,
            type: "LinkedDomains",
            serviceEndpoint: "https://example.com/did",
          },
        ],
      };
    },
  });

  const thirdDidState = await resolveDid({ did });
  assert.deepStrictEqual(thirdDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    controller: [did],
    capabilityInvocation: [
      {
        id: `${did}#auth`,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyMultibase: authPublicKeyMultibase2,
      },
    ],
    service: [
      {
        id: `${did}#service`,
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/did",
      },
    ],
  });

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", did);
  console.log("Topic ID: ", topicId);
  client.close();
}

run();
