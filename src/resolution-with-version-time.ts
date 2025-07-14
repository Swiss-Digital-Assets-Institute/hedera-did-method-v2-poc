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

  const authPrivateKey = PrivateKey.generateED25519();
  const authPublicKey = authPrivateKey.publicKey;
  const authPublicKeyMultibase = KeysUtility.fromBytes(
    authPublicKey.toBytesRaw()
  ).toMultibase();

  // 1. Create DID
  const { did, topicId, didDocument, versionId, versionTime } =
    await createDidAndPublish({
      client,
      signer: new InternalEd25519Signer(authPrivateKey),
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

  console.log("===== DID Document V1 =====");
  console.log("Version ID: ", versionId);
  console.log("Version Time: ", versionTime);
  console.log();

  // Wait for 1 minute to ensure the version time is different
  await new Promise((resolve) => setTimeout(resolve, 60000));

  const { versionId: updatedVersionId, versionTime: updatedVersionTime } =
    await updateDidAndPublish({
      client,
      did,
      topicId,
      signer: new InternalEd25519Signer(authPrivateKey),
      verificationMethodId: `${did}#auth`,
      didDocument,
      updateFn: (doc) => {
        return {
          ...doc,
          service: [
            ...(doc.service ?? []),
            {
              id: `${did}#service2`,
              type: "LinkedDomains",
              serviceEndpoint: "https://example.com/did2",
            },
          ],
        };
      },
    });

  console.log("===== DID Document V2 =====");
  console.log("Version ID: ", updatedVersionId);
  console.log("Version Time: ", updatedVersionTime);
  console.log();

  const resolvedDidDocument = await resolveDid({
    did,
    versionTime,
  });

  assert.deepStrictEqual(resolvedDidDocument, {
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
  client.close();
}

run();
