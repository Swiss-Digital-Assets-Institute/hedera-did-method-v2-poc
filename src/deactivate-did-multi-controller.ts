import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import assert from "assert";
import { createDidAndPublish } from "./shared/create-did";
import { deactivateDidAndPublish } from "./shared/deactivate-did";
import { InternalEd25519Signer } from "./shared/ed25519-signer";
import { resolveDid } from "./shared/resolver";

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  // 1. Create DID controller
  const controllerPrivateKey = PrivateKey.generateED25519();
  const controllerPublicKey = controllerPrivateKey.publicKey;
  const controllerPublicKeyMultibase = KeysUtility.fromBytes(
    controllerPublicKey.toBytesRaw()
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

  // 2. Create a DID to be deactivated
  const privateKey = PrivateKey.generateED25519();
  const publicKey = privateKey.publicKey;
  const publicKeyMultibase = KeysUtility.fromBytes(
    publicKey.toBytesRaw()
  ).toMultibase();

  const { did: didWithControllers, topicId } = await createDidAndPublish({
    client,
    signer: new InternalEd25519Signer(privateKey),
    controllers: [controllerDid],
    partialDidDocument: (did) => ({
      verificationMethod: [
        {
          id: `${did}#key-1`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase,
        },
      ],
      capabilityInvocation: [
        {
          id: `${did}#controller`,
          type: "Ed25519VerificationKey2020",
          controller: controllerDid,
          publicKeyMultibase: controllerPublicKeyMultibase,
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#controller`,
  });

  const firstDidState = await resolveDid({ did: didWithControllers });
  assert.deepStrictEqual(firstDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: didWithControllers,
    controller: [controllerDid],
    verificationMethod: [
      {
        id: `${didWithControllers}#key-1`,
        type: "Ed25519VerificationKey2020",
        controller: didWithControllers,
        publicKeyMultibase,
      },
    ],
    capabilityInvocation: [
      {
        id: `${didWithControllers}#controller`,
        type: "Ed25519VerificationKey2020",
        controller: controllerDid,
        publicKeyMultibase: controllerPublicKeyMultibase,
      },
    ],
  });

  // 3. Updating the DID with the second controller
  await deactivateDidAndPublish({
    client,
    did: didWithControllers,
    topicId,
    signer: new InternalEd25519Signer(controllerPrivateKey),
    verificationMethodId: `${didWithControllers}#controller`,
  });

  const secondDidState = await resolveDid({ did: didWithControllers });
  assert.deepStrictEqual(secondDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: didWithControllers,
    controller: [],
  });

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", didWithControllers);
  console.log("Topic ID: ", topicId);
  client.close();
}

run();
