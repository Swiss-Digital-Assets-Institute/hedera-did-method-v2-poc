import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import assert from "assert";
import { inspect } from "util";
import { resolveDid } from "./shared/resolver";
import { createDidAndPublish } from "./shared/create-did";
import { updateDidAndPublish } from "./shared/update-did";

interface Controller {
  did: string;
  privateKey: PrivateKey;
  verificationMethodId: string;
  publicKeyMultibase: string;
}

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  const controllers: Controller[] = [];

  // 1. Create three DID controllers
  for (let i = 0; i < 3; i++) {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    const publicKeyMultibase = KeysUtility.fromBytes(
      publicKey.toBytesRaw()
    ).toMultibase();

    const { did } = await createDidAndPublish({
      client,
      privateKey,
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

    controllers.push({
      did,
      privateKey,
      verificationMethodId: `${did}#auth`,
      publicKeyMultibase,
    });
  }

  // 2. Create a DID with the three controllers
  const privateKey1 = PrivateKey.generateED25519();
  const publicKey1 = privateKey1.publicKey;
  const publicKeyMultibase1 = KeysUtility.fromBytes(
    publicKey1.toBytesRaw()
  ).toMultibase();

  const { did: didWithControllers, topicId } = await createDidAndPublish({
    client,
    privateKey: controllers[0].privateKey,
    controllers: controllers.map((c) => c.did),
    partialDidDocument: (did) => ({
      verificationMethod: [
        {
          id: `${did}#key-1`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: publicKeyMultibase1,
        },
      ],
      capabilityInvocation: controllers.map((c, index) => ({
        id: `${did}#controller-${index}`,
        type: "Ed25519VerificationKey2020",
        controller: c.did,
        publicKeyMultibase: c.publicKeyMultibase,
      })),
    }),
    verificationMethodId: (did) => `${did}#controller-0`,
  });

  const firstDidState = await resolveDid({ did: didWithControllers });
  assert.deepStrictEqual(firstDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: didWithControllers,
    controller: controllers.map((c) => c.did),
    verificationMethod: [
      {
        id: `${didWithControllers}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: didWithControllers,
        publicKeyMultibase: publicKeyMultibase1,
      },
    ],
    capabilityInvocation: controllers.map((c, index) => ({
      id: `${didWithControllers}#controller-${index}`,
      type: "Ed25519VerificationKey2020",
      controller: c.did,
      publicKeyMultibase: c.publicKeyMultibase,
    })),
  });

  // 3. Updating the DID with the second controller
  await updateDidAndPublish({
    client,
    did: didWithControllers,
    topicId,
    privateKey: controllers[1].privateKey,
    verificationMethodId: `${didWithControllers}#controller-1`,
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

  const secondDidState = await resolveDid({ did: didWithControllers });
  assert.deepStrictEqual(secondDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: didWithControllers,
    controller: controllers.map((c) => c.did),
    verificationMethod: [
      {
        id: `${didWithControllers}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: didWithControllers,
        publicKeyMultibase: publicKeyMultibase1,
      },
    ],
    service: [
      {
        id: `${didWithControllers}#service`,
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/did",
      },
    ],
    capabilityInvocation: controllers.map((c, index) => ({
      id: `${didWithControllers}#controller-${index}`,
      type: "Ed25519VerificationKey2020",
      controller: c.did,
      publicKeyMultibase: c.publicKeyMultibase,
    })),
  });

  // 4. Updating controller by not authorized controller
  const notAuthorizedPrivateKey = PrivateKey.generateED25519();
  const notAuthorizedPublicKey = notAuthorizedPrivateKey.publicKey;
  const notAuthorizedPublicKeyMultibase = KeysUtility.fromBytes(
    notAuthorizedPublicKey.toBytesRaw()
  ).toMultibase();

  await createDidAndPublish({
    client,
    privateKey: notAuthorizedPrivateKey,
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: notAuthorizedPublicKeyMultibase,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#auth`,
  });

  await updateDidAndPublish({
    client,
    did: didWithControllers,
    topicId,
    privateKey: notAuthorizedPrivateKey,
    verificationMethodId: `${didWithControllers}#controller-1`,
    didDocument: secondDidState,
    updateFn: (doc) => {
      return {
        ...doc,
        authentication: [
          {
            id: `${doc.id}#auth-2`,
            type: "Ed25519VerificationKey2020",
            controller: doc.id,
            publicKeyMultibase: notAuthorizedPublicKeyMultibase,
          },
        ],
      };
    },
  });

  // DID should not be updated
  const thirdDidState = await resolveDid({ did: didWithControllers });
  assert.deepStrictEqual(thirdDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: didWithControllers,
    controller: controllers.map((c) => c.did),
    verificationMethod: [
      {
        id: `${didWithControllers}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: didWithControllers,
        publicKeyMultibase: publicKeyMultibase1,
      },
    ],
    service: [
      {
        id: `${didWithControllers}#service`,
        type: "LinkedDomains",
        serviceEndpoint: "https://example.com/did",
      },
    ],
    capabilityInvocation: controllers.map((c, index) => ({
      id: `${didWithControllers}#controller-${index}`,
      type: "Ed25519VerificationKey2020",
      controller: c.did,
      publicKeyMultibase: c.publicKeyMultibase,
    })),
  });

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", didWithControllers);
  console.log("Topic ID: ", topicId);
  client.close();
}

run();
