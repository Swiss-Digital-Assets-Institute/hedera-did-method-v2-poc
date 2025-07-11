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

  // 0. Create a new controller
  const controllerPrivateKey1 = PrivateKey.generateED25519();
  const controllerPublicKeyMultibase1 = KeysUtility.fromPublicKey(
    controllerPrivateKey1.publicKey
  ).toMultibase();

  const controllerPrivateKey2 = PrivateKey.generateED25519();
  const controllerPublicKeyMultibase2 = KeysUtility.fromPublicKey(
    controllerPrivateKey2.publicKey
  ).toMultibase();

  const { did: controllerDid } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(controllerPrivateKey1),
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: controllerPublicKeyMultibase1,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#auth`,
  });

  // 1. Create DID
  const { did, topicId } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(controllerPrivateKey1),
    controllers: [controllerDid],
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#controller`,
          type: "Ed25519VerificationKey2020",
          controller: controllerDid,
          publicKeyMultibase: controllerPublicKeyMultibase1,
        },
      ],
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
    controller: [controllerDid],
    capabilityInvocation: [
      {
        id: `${did}#controller`,
        type: "Ed25519VerificationKey2020",
        controller: controllerDid,
        publicKeyMultibase: controllerPublicKeyMultibase1,
      },
    ],
  });

  // 2. Rotate #controller verification method
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(controllerPrivateKey1),
    verificationMethodId: `${did}#controller`,
    didDocument: firstDidState,
    updateFn: (doc) => {
      return {
        ...doc,
        capabilityInvocation: [
          {
            id: `${did}#controller`,
            type: "Ed25519VerificationKey2020",
            controller: controllerDid,
            publicKeyMultibase: controllerPublicKeyMultibase2,
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
    controller: [controllerDid],
    capabilityInvocation: [
      {
        id: `${did}#controller`,
        type: "Ed25519VerificationKey2020",
        controller: controllerDid,
        publicKeyMultibase: controllerPublicKeyMultibase2,
      },
    ],
  });

  // 3. Make an update with the new key
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(controllerPrivateKey2),
    verificationMethodId: `${did}#controller`,
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
    controller: [controllerDid],
    capabilityInvocation: [
      {
        id: `${did}#controller`,
        type: "Ed25519VerificationKey2020",
        controller: controllerDid,
        publicKeyMultibase: controllerPublicKeyMultibase2,
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
