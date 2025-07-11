import { Client, PrivateKey } from "@hashgraph/sdk";
import { bls12_381 as bls } from "@noble/curves/bls12-381";
import { KeysUtility } from "@swiss-digital-assets-institute/core";
import assert from "assert";
import { inspect } from "util";
import { createDidAndPublish } from "./shared/create-did";
import { InternalEd25519Signer } from "./shared/ed25519-signer";
import { resolveDid } from "./shared/resolver";

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

  const privateKey = bls.utils.randomPrivateKey();

  const g2PublicKey = bls.getPublicKeyForShortSignatures(privateKey);
  const g2PublicKeyBase58 = KeysUtility.fromBytes(g2PublicKey).toBase58();

  const g1PublicKey = bls.getPublicKey(privateKey);
  const g1PublicKeyBase58 = KeysUtility.fromBytes(g1PublicKey).toBase58();

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
          id: `${did}#key-0`,
          type: "Bls12381G1Key2020",
          controller: did,
          publicKeyBase58: g1PublicKeyBase58,
        },
        {
          id: `${did}#key-1`,
          type: "Bls12381G2Key2020",
          controller: did,
          publicKeyBase58: g2PublicKeyBase58,
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
        id: `${did}#key-0`,
        type: "Bls12381G1Key2020",
        controller: did,
        publicKeyBase58: g1PublicKeyBase58,
      },
      {
        id: `${did}#key-1`,
        type: "Bls12381G2Key2020",
        controller: did,
        publicKeyBase58: g2PublicKeyBase58,
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
