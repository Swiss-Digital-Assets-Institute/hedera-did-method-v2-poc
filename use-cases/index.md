# Use cases

## 1. Verification Method Rotation

Verification method rotation is the process of replacing an old cryptographic key with a new one in a DID Document. This is done for security reasons—only active (current) verification methods should be listed in the DID Document.

**Example Scenario:**  
A user wants to improve security by rotating (changing) their verification method for capability invocation every month. This is the only verification method in their DID Document.

### First Version

The user's initial DID Document looks like this:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:example:123456789abcdefghi",
  "capabilityInvocation": [
    {
      "id": "did:example:123456789abcdefghi#root-key",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:example:123456789abcdefghi",
      "publicKeyMultibase": "zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
    }
  ]
}
```

This document is signed using the private key that corresponds to the public key `zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV`.

### After One Month: First Rotation

After a month, the user rotates their verification method. The updated DID Document is:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:example:123456789abcdefghi",
  "capabilityInvocation": [
    {
      "id": "did:example:123456789abcdefghi#root-key",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:example:123456789abcdefghi",
      "publicKeyMultibase": "z2DhMLJmV8kNQm6zeWUrXQKtmzoh6YkKHSRxVSibscDQ7nq" // Updated public key
    }
  ]
}
```

This new version is signed with the private key corresponding to the **previous** public key (`zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV`).

### After Another Month: Second Rotation

After another month, the user rotates the verification method again. The DID Document now looks like this:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:example:123456789abcdefghi",
  "capabilityInvocation": [
    {
      "id": "did:example:123456789abcdefghi#root-key",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:example:123456789abcdefghi",
      "publicKeyMultibase": "zPGHVsCZXDE40VylpEwQ0QlAnLkw2empYUxtIK9SGegFgU0" // Updated public key
    }
  ]
}
```

This version is signed with the private key corresponding to the **previous** public key (`z2DhMLJmV8kNQm6zeWUrXQKtmzoh6YkKHSRxVSibscDQ7nq`).

---

### Why Previous States Matter

When verifying a DID Document, it's crucial to be able to resolve (retrieve) the document as it existed at a specific point in time. This is because cryptographic proofs (such as signatures) are created using the keys that were valid at the time the proof was made.

**Example:**  
Suppose someone signed a document in February using the public key that was listed in the DID Document at that time. In March, the user rotates their key and updates the DID Document with a new public key. If you try to verify the February signature using the current (March) version of the DID Document, the verification will fail—because the key has changed.

To correctly verify the signature, you need to look up the DID Document as it was in February, when the original key was still valid. This ensures that the proof (signature) matches the verification method that was active when the proof was created.

### DID Core Specification

> Proofs or signatures that rely on verification methods that are not present in the latest version of a DID document are not impacted by rotation. In these cases, verification software might require additional information, such as when a particular verification method was expected to be valid as well as access to a verifiable data registry containing a historical record, to determine the validity of the proof or signature. This option might not be available in all DID methods.

Source: https://www.w3.org/TR/did-1.0/#verification-method-rotation

In a DID Resolution specification, there are `versionId` and `versionTime` parameters to help achieve this.

https://www.w3.org/TR/did-resolution/#did-parameters
