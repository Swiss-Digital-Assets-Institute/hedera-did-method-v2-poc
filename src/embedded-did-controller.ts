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

  // 1. Create DID controller
  const controllerPrivateKey = PrivateKey.generateED25519();
  const controllerPublicKeyMultibase = KeysUtility.fromPublicKey(
    controllerPrivateKey.publicKey
  ).toMultibase();

  const { did: controllerDid } = await createDidAndPublish({
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

  // 2. Create a DID with the controller
  const { did: subjectDid, topicId } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(controllerPrivateKey),
    controllers: [controllerDid],
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#controller-0`,
          type: "Ed25519VerificationKey2020",
          controller: controllerDid,
          publicKeyMultibase: controllerPublicKeyMultibase,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#controller-0`,
  });

  const firstDidState = await resolveDid({ did: subjectDid });
  assert.deepStrictEqual(firstDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: subjectDid,
    controller: [controllerDid],
    capabilityInvocation: [
      {
        id: `${subjectDid}#controller-0`,
        type: "Ed25519VerificationKey2020",
        controller: controllerDid,
        publicKeyMultibase: controllerPublicKeyMultibase,
      },
    ],
  });

  // 3. Updating the DID with the second controller
  await updateDidAndPublish({
    client,
    did: subjectDid,
    topicId,
    signer: new InternalEd25519Signer(controllerPrivateKey),
    verificationMethodId: `${subjectDid}#controller-0`,
    didDocument: firstDidState,
    updateFn: (doc) => {
      return {
        ...doc,
        service: [
          {
            id: `${doc.id}#service`,
            type: "LinkedDomains",
            serviceEndpoint: "https://example.com/did",
          },
        ],
      };
    },
  });

  const secondDidState = await resolveDid({ did: subjectDid });
  assert.deepStrictEqual(secondDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: subjectDid,
    controller: [controllerDid],
    service: [
      {
        id: `${subjectDid}#service`,
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/did",
      },
    ],
    capabilityInvocation: [
      {
        id: `${subjectDid}#controller-0`,
        type: "Ed25519VerificationKey2020",
        controller: controllerDid,
        publicKeyMultibase: controllerPublicKeyMultibase,
      },
    ],
  });

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", subjectDid);
  console.log("Topic ID: ", topicId);
  client.close();
}

run();
