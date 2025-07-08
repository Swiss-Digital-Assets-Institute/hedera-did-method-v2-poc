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

  // 0. Create a self-controlled DID
  const controllerPrivateKey = PrivateKey.generateED25519();
  const controllerPublicKeyMultibase = KeysUtility.fromPublicKey(
    controllerPrivateKey.publicKey
  ).toMultibase();

  const { did, topicId } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(controllerPrivateKey),
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: controllerPublicKeyMultibase,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#auth`,
  });

  // 1. Create a new controller
  const newControllerPrivateKey = PrivateKey.generateED25519();
  const newControllerPublicKeyMultibase = KeysUtility.fromPublicKey(
    newControllerPrivateKey.publicKey
  ).toMultibase();

  const { did: newControllerDid } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(newControllerPrivateKey),
    partialDidDocument: (did) => ({
      verificationMethod: [
        {
          id: `${did}#controller`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: newControllerPublicKeyMultibase,
        },
      ],
      capabilityInvocation: [`${did}#controller`],
    }),
    verificationMethodId: (did) => `${did}#controller`,
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
        publicKeyMultibase: controllerPublicKeyMultibase,
      },
    ],
  });

  // 2. Transfer ownership to the new controller
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(controllerPrivateKey),
    verificationMethodId: `${did}#auth`,
    didDocument: firstDidState,
    updateFn: (doc) => {
      return {
        ...doc,
        controller: [newControllerDid],
        capabilityInvocation: [`${newControllerDid}#controller`],
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
    controller: [newControllerDid],
    capabilityInvocation: [`${newControllerDid}#controller`],
  });

  // 3. Make an update with the new key
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(newControllerPrivateKey),
    verificationMethodId: `${newControllerDid}#controller`,
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
    controller: [newControllerDid],
    capabilityInvocation: [`${newControllerDid}#controller`],
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
