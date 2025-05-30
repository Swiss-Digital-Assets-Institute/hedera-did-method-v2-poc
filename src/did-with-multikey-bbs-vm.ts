import { Client, PrivateKey } from "@hashgraph/sdk";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import { bls12_381 as bls } from "@noble/curves/bls12-381";
import { resolveDid } from "./shared/resolver";
import { createDidAndPublish } from "./shared/create-did";
import assert from "assert";
import { InternalEd25519Signer } from "./shared/ed25519-signer";
import { inspect } from "util";

function os2ip(bytes: Uint8Array): bigint {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result <<= 8n;
    result += BigInt(bytes[i]);
  }
  return result;
}

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

  const privateKeys = [
    bls.utils.randomPrivateKey(),
    bls.utils.randomPrivateKey(),
    bls.utils.randomPrivateKey(),
    bls.utils.randomPrivateKey(),
  ];

  const aggregatedKey = bls.aggregatePublicKeys(
    privateKeys.map(bls.getPublicKey)
  );

  const bbsPublicKeyMultibase =
    KeysUtility.fromBytes(aggregatedKey).toMultibase("base58btc");

  // 1. Create DID
  const { did, topicId } = await createDidAndPublish({
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
      verificationMethod: [
        {
          id: `${did}#bbs`,
          type: "Multikey",
          controller: did,
          publicKeyMultibase: bbsPublicKeyMultibase,
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
    verificationMethod: [
      {
        id: `${did}#bbs`,
        type: "Multikey",
        controller: did,
        publicKeyMultibase: bbsPublicKeyMultibase,
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

  console.log(inspect(firstDidState, { depth: null }));

  console.log("===== Results =====");
  console.log("Status: success");
  console.log("DID: ", did);
  console.log("Topic ID: ", topicId);
  client.close();
}

run();
