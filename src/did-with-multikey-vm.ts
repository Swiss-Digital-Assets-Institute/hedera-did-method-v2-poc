import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { resolveDid } from "./shared/resolver";
import { createDidAndPublish } from "./shared/create-did";
import assert from "assert";
import { InternalECDSASigner } from "./shared/ecdsa-signer";

async function run() {
  const client = Client.forTestnet().setOperator(
    process.env.HEDERA_TESTNET_ACCOUNT_ID ?? "",
    process.env.HEDERA_TESTNET_PRIVATE_KEY ?? ""
  );

  const authPrivateKey = PrivateKey.generateECDSA();
  const authPublicKey = authPrivateKey.publicKey;
  const authPublicKeyMultibase = KeysUtility.fromBytes(
    authPublicKey.toBytesRaw()
  ).toMultibase("base58btc");

  // 1. Create DID
  const { did, topicId } = await createDidAndPublish({
    client,
    signer: new InternalECDSASigner(authPrivateKey),
    partialDidDocument: (did) => ({
      capabilityInvocation: [
        {
          id: `${did}#auth`,
          type: "Multikey",
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

  const firstDidState = await resolveDid({ did });
  assert.deepStrictEqual(firstDidState, {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/multikey/v1",
    ],
    id: did,
    controller: [did],
    capabilityInvocation: [
      {
        id: `${did}#auth`,
        type: "Multikey",
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
  console.log("DID: ", did);
  console.log("Topic ID: ", topicId);
  client.close();
}

run();
