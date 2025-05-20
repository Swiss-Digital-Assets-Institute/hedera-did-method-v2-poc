import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { resolveDid } from "./shared/resolver";
import { createDidAndPublish } from "./shared/create-did";
import { updateDidAndPublish } from "./shared/update-did";
import assert from "assert";

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  const authPrivateKey = PrivateKey.generateED25519();
  const authPublicKey = authPrivateKey.publicKey;
  const authPublicKeyMultibase = KeysUtility.fromBytes(
    authPublicKey.toBytesRaw()
  ).toMultibase();

  // 1. Create DID
  const { did, topicId, didDocument } = await createDidAndPublish({
    client,
    privateKey: authPrivateKey,
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Ed25519VerificationKey2020",
          controller: did,
          publicKeyMultibase: authPublicKeyMultibase,
        },
      ],
      service: [
        {
          id: `${did}#service`,
          type: "LinkedDomains",
          serviceEndpoint: "https://example.com/did",
        },
      ],
    }),
    verificationMethodId: (did) => `${did}#auth`,
  });

  // 2. Add another capability invocation method (JWK)
  const secondPrivateKey = PrivateKey.generateED25519();
  const secondPublicKey = secondPrivateKey.publicKey;

  const updatedDidDocument = await updateDidAndPublish({
    client,
    did,
    topicId,
    privateKey: authPrivateKey,
    verificationMethodId: `${did}#auth`,
    didDocument,
    updateFn: (doc) => {
      return {
        ...doc,
        capabilityInvocation: [
          ...(doc.capabilityInvocation ?? []),
          {
            id: `${doc.id}#key-2`,
            type: "JsonWebKey2020",
            controller: doc.id,
            publicKeyJwk: {
              kty: "OKP",
              crv: "Ed25519",
              alg: "EdDSA",
              x: Buffer.from(secondPublicKey.toBytesRaw()).toString(
                "base64url"
              ),
            },
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
        publicKeyMultibase: authPublicKeyMultibase,
      },
      {
        id: `${did}#key-2`,
        type: "JsonWebKey2020",
        controller: did,
        publicKeyJwk: {
          kty: "OKP",
          crv: "Ed25519",
          alg: "EdDSA",
          x: Buffer.from(secondPublicKey.toBytesRaw()).toString("base64url"),
        },
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
