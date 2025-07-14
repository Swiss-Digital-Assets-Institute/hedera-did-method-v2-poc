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
  const { did, topicId, didDocument } = await createDidAndPublish({
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
      authentication: [`${did}#auth`],
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

  // 2. Remove authentication method
  const updatedDidDocument = await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(authPrivateKey),
    verificationMethodId: `${did}#auth`,
    didDocument,
    updateFn: (doc) => {
      return {
        ...doc,
        authentication: [],
      };
    },
  });

  // 3. Remove services
  await updateDidAndPublish({
    client,
    did,
    topicId,
    signer: new InternalEd25519Signer(authPrivateKey),
    verificationMethodId: `${did}#auth`,
    didDocument: updatedDidDocument.didDocument,
    updateFn: (doc) => {
      return {
        ...doc,
        service: [],
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
        publicKeyMultibase: authPublicKeyMultibase,
      },
    ],
    authentication: [],
    service: [],
  });

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", did);
  console.log("Topic ID: ", topicId);
  console.log("Final state: ", thirdDidState);
  client.close();
}

run();
