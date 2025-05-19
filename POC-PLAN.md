## Hedera DID v2.0 Proof-of-Concept Plan

### Description

This document details the Proof-of-Concept (PoC) plan for validating crucial features of the Hedera DID Method v2.0 specification. The focus is on the **controller and proof model**, **key rotation**, and **specified verification methods**. It outlines the PoC's objectives, scope, technical approach, and validation methodology.

### Objectives

1.  **Validate the Controller and Proof Model**: Ensure the DID method supports single and multi-controller operations with enforceable permissions.
2.  **Demonstrate Secure Key Rotation**: Illustrate secure key rotation for controller keys without disrupting DID resolution.
3.  **Verify Verification Methods**: Test the implementation of specified verification methods (e.g., `JWK`, `ECDSA`).
4.  **Ensure Compliance**: Confirm all implementations align with the Hedera DID Method v2.0 specification.

### Scope

This PoC will validate the following Hedera DID Method v2.0 features:

  - **Single-controller DID operations**: Creation, updates, and resolution.
  - **Multi-controller DID operations**: Creation, updates, and resolution with threshold signatures.
  - **Key Rotation**: Secure rotation of controller keys.
  - **Verification Methods**: Implementation and validation of `JWK` and other specified verification methods.

### Success Criteria

1.  **Functional Validation**:
      * DID documents resolve correctly for all operations (creation, updates, deactivation).
      * Key rotation does not disrupt existing DID references.
      * Verification methods are cryptographically verifiable.
2.  **Performance Metrics**:
      * DID operations complete within acceptable latency (e.g., \<5s for Hedera consensus).
3.  **Compliance**:
      * All implementations pass automated tests against the v2.0 specification.

### Technical Approach

1.  **Hedera Hashgraph SDK**: Utilize the official SDK for DID document transactions.
2.  **TypeScript/Node.js**: Develop PoC logic in `TypeScript` with `Node.js` for type safety and modularity.
3.  **Test Framework**: Employ `Jest` or `Mocha` as the test framework for unit and integration tests.
4.  **Local Network**: Deploy and utilize a local Hedera testnet for validation.

### Dependencies

1.  **Hedera Testnet Access**: Requires a local or testnet Hedera network with funded accounts.
2.  **SDK Updates**: Ensure compatibility with the latest Hedera SDK version.
3.  **Cryptographic Libraries**: Utilize libraries for `JWK` and other verification methods (e.g., `jose` for `JWK`).

### PoC Subtasks

#### 1\. Single-Controller DID Operations

  - **Objective**: Validate the basic DID lifecycle (create, update, resolve) under a single controller.
  - **Steps**:
    1.  Create a DID with a single controller.
    2.  Update the DID document (add/remove verification methods, services).
    3.  Resolve the DID and verify document integrity.
  - **Success Criteria**:
      * DID resolves to the correct document post-update.
      * Updates are cryptographically signed by the controller.
  - **Relevant PoC(s)**:
      * [`Create DID with Controller`](https://www.google.com/search?q=src/create-did-with-controller.ts) (Run: `npm run poc:create-did-with-controller`) - Demonstrates DID creation with a single controller.
      * [`Remove Service and Method`](https://www.google.com/search?q=src/remove-service-and-method.ts) (Run: `npm run poc:remove-service-and-method`) - Demonstrates updating a DID by removing services and verification methods.
      * [`Deactivate DID (Self)`](https://www.google.com/search?q=src/deactivate-did-self.ts) (Run: `npm run poc:deactivate-did-self`) - Demonstrates deactivating a DID by its own controller.

#### 2\. Multi-Controller DID Operations

  - **Objective**: Validate DID operations requiring multi-controller consensus.
  - **Steps**:
    1.  Create a DID with multiple controllers and a threshold signature requirement.
    2.  Test updates requiring partial/full controller approval.
    3.  Resolve the DID and verify consensus rules.
  - **Success Criteria**:
      * Updates fail without sufficient controller signatures.
      * Resolved documents reflect multi-controller permissions.
  - **Relevant PoC(s)**:
      * [`Update DID with Multiple Controllers`](https://www.google.com/search?q=src/update-did-with-multiple-controller.ts) (Run: `npm run poc:update-did-with-multiple-controller`) - Demonstrates DID creation with multiple controllers and subsequent updates.
      * [`Deactivate DID (Multi-Controller)`](https://www.google.com/search?q=src/deactivate-did-multi-controller.ts) (Run: `npm run poc:deactivate-did-multi-controller`) - Demonstrates deactivating a DID with multiple controllers.

#### 3\. Key Rotation

  - **Objective**: Validate the ability to rotate controller keys without disrupting DID resolution.
  - **Steps**:
    1.  Initiate key rotation for a controller key.
    2.  Verify the invalidation of old keys and the functionality of new keys.
    3.  Ensure DID resolution remains uninterrupted throughout the process.
  - **Success Criteria**:
      * Old keys cannot sign updates post-rotation.
      * DID resolution includes the new key in the document.
  - **Relevant PoC(s)**:
      * (No specific PoC for key rotation was listed in the provided table of available PoCs.)

#### 4\. Verification Methods

  - **Objective**: Validate the implementation and functionality of specified verification methods (e.g., `JWK`).
  - **Steps**:
    1.  Add a `JWK` verification method to a DID document.
    2.  Test cryptographic verification of signatures.
    3.  Repeat for other specified methods (e.g., `ECDSA`).
  - **Success Criteria**:
      * Verification methods are resolvable and verifiable.
      * Signatures pass cryptographic validation.
  - **Relevant PoC(s)**:
      * [`Update DID with JWK Verification Method`](https://www.google.com/search?q=src/update-did-with-jwkVerificationMethod.ts) (Run: `npm run poc:jwk-verification-method`) - Demonstrates adding a `JWK`-based verification method.

### Validation Methodology

1.  **Automated Tests**: Execute unit tests for individual operations (e.g., key rotation, verification) and integration tests for the end-to-end DID lifecycle.
2.  **Manual Verification**: Inspect resolved DID documents for compliance with the v2.0 specification and validate cryptographic operations using external tools (e.g., `jose`).
3.  **Performance Testing**: Measure the latency of DID operations on the Hedera testnet.