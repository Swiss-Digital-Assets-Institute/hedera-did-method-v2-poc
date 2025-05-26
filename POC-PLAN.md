## Hedera DID v2.0 Proof-of-Concept Plan

### Description

This Proof-of-Concept (PoC) plan outlines the validation of key features within the Hedera DID Method v2.0 specification, specifically targeting the **controller and proof model**, **key rotation**, and **specified verification methods**. It details the PoC's objectives, scope, technical approach, and validation methods.

### Objectives

1.  **Validate the Controller and Proof Model**: Ensure the DID method effectively supports single and multi-controller operations with enforceable permissions.
2.  **Demonstrate Secure Key Rotation**: Illustrate a secure key rotation process for controller keys without disrupting DID resolution.
3.  **Verify Verification Methods**: Test the implementation and functionality of specified verification methods (e.g., `JWK`, `ECDSA`).
4.  **Ensure Compliance**: Confirm all implementations align with the Hedera DID Method v2.0 specification.

### Scope

This PoC will validate the following Hedera DID Method v2.0 features:

* **Single-controller DID operations**: Creation, updates, deactivation, and resolution.
* **Multi-controller DID operations**: Creation, updates, deactivation, and resolution, including scenarios with threshold signatures.
* **Key Rotation**: Secure rotation of controller keys.
* **Verification Methods**: Implementation and validation of `JWK` and other specified verification methods.

### Success Criteria

1.  **Functional Validation**:
    * DID documents correctly resolve after all operations (creation, updates, deactivation).
    * Key rotation processes successfully without disrupting existing DID references or resolution.
    * Verification methods are correctly implemented and cryptographically verifiable.
    * Controller permissions and signature thresholds are enforced as expected.
2.  **Performance Metrics**:
    * DID operations (creation, update, resolution, deactivation) complete within acceptable latency parameters (e.g., under 5 seconds for Hedera consensus finality).
3.  **Compliance**:
    * All implemented features pass automated tests benchmarked against the Hedera DID Method v2.0 specification.

### Technical Approach

1.  **Hedera Hashgraph SDK**: Utilize the official Hedera Hashgraph SDK for all DID document transactions on the Hedera network.
2.  **TypeScript/Node.js**: Develop PoC logic in `TypeScript` with `Node.js` to leverage type safety and ensure modular code structure.
3.  **Test Framework**: Employ `Jest` or `Mocha` as the testing framework for comprehensive unit and integration tests.
4.  **Local Network**: Deploy and utilize a local Hedera testnet environment for controlled validation and testing.

### Dependencies

1.  **Hedera Testnet Access**: Requires access to a local or public Hedera testnet with adequately funded accounts.
2.  **SDK Updates**: Ensure compatibility with the latest stable version of the Hedera SDK.
3.  **Cryptographic Libraries**: Utilize robust cryptographic libraries for handling `JWK` and other specified verification methods (e.g., `jose` for `JWK`).

### PoC Subtasks

#### 1. Single-Controller DID Operations

* **Objective**: Validate the basic DID lifecycle (create, update, resolve, deactivate) under the control of a single entity.
* **Steps**:
    1.  Create a new DID document with a single controller.
    2.  Update the DID document by adding or removing verification methods and services.
    3.  Deactivate the DID using its designated controller.
    4.  Resolve the DID at each stage (post-creation, post-update, post-deactivation) and verify the integrity and status of the document.
* **Success Criteria**:
    * The DID document accurately reflects all creation, update, and deactivation operations.
    * All controller operations are cryptographically signed by the controller and are verifiable.
    * DID resolution remains accurate and consistent throughout its lifecycle.
* **Relevant PoC(s)**:
    * `src/controller.ts` (Run: `npm run poc:controller`) - Demonstrates basic single-controller DID operations.
    * `src/create-did-with-controller.ts` (Run: `npm run poc:create-did-with-controller`) - Demonstrates DID creation with a single controller.
    * `src/remove-service-and-method.ts` (Run: `npm run poc:remove-service-and-method`) - Demonstrates updating a DID by removing services and verification methods.
    * `src/deactivate-did-self.ts` (Run: `npm run poc:deactivate-did-self`) - Demonstrates deactivating a DID by its own controller.

#### 2. Multi-Controller DID Operations

* **Objective**: Validate DID operations that require consensus from multiple controllers, including threshold signature requirements.
* **Steps**:
    1.  Create a DID with multiple controllers and a defined threshold signature requirement.
    2.  Perform updates that require partial and full controller approval based on the threshold.
    3.  Attempt updates with insufficient controller signatures to verify rejection.
    4.  Resolve the DID and verify that the document and consensus rules are correctly applied.
* **Success Criteria**:
    * Updates requiring multi-controller approval fail if an insufficient number of controller signatures are provided.
    * Successfully applied updates are correctly reflected in the resolved DID document.
    * Resolved DID documents accurately represent multi-controller permissions and states.
* **Relevant PoC(s)**:
    * `src/multi-controller.ts` (Run: `npm run poc:multi-controller`) - Demonstrates basic multi-controller DID operations.
    * `src/update-did-with-multiple-controller.ts` (Run: `npm run poc:update-did-with-multiple-controller`) - Demonstrates DID creation with multiple controllers and subsequent updates.
    * `src/deactivate-did-multi-controller.ts` (Run: `npm run poc:deactivate-did-multi-controller`) - Demonstrates deactivating a DID with multiple controllers.

#### 3. Key Rotation

* **Objective**: Validate the secure rotation of controller keys without interrupting DID resolution or invalidating the DID.
* **Steps**:
    1.  Initiate the key rotation process for an existing controller key.
    2.  Verify that the old key is invalidated and can no longer authorize changes to the DID document.
    3.  Confirm that the new key can successfully authorize changes.
    4.  Ensure DID resolution remains uninterrupted and reflects the new key in the updated DID document.
* **Success Criteria**:
    * Attempts to use old keys for signing updates post-rotation fail.
    * New keys successfully sign updates.
    * The resolved DID document includes the new controller key and associated metadata.
    * DID resolution is consistently successful before, during, and after key rotation.
* **Relevant PoC(s)**:
    * (No specific PoC script for key rotation was listed. This subtask will require development or identification of relevant test scripts.)

#### 4. Verification Methods

* **Objective**: Validate the implementation, functionality, and cryptographic verifiability of specified verification methods (e.g., `JWK`).
* **Steps**:
    1.  Add a `JWK` (JSON Web Key) verification method to an existing DID document.
    2.  Create a signature using the private key corresponding to the added `JWK` verification method.
    3.  Verify the signature against the public key in the `JWK` verification method retrieved from the resolved DID document.
    4.  Repeat steps 1-3 for other specified verification methods (e.g., `EcdsaSecp256k1RecoveryMethod2020`, if applicable).
* **Success Criteria**:
    * Specified verification methods can be successfully added to and resolved from a DID document.
    * Signatures created using the private key material associated with a verification method are cryptographically verifiable against the public key material in the DID document.
* **Relevant PoC(s)**:
    * `src/update-did-with-jwkVerificationMethod.ts` (Run: `npm run poc:jwk-verification-method`) - Demonstrates adding a `JWK`-based verification method.

### Validation Methodology

1.  **Automated Tests**: Implement and execute unit tests for individual functions and modules (e.g., key generation, signature validation, key rotation logic) and integration tests for end-to-end DID lifecycle operations.
2.  **Manual Verification**: Manually inspect resolved DID documents for structural correctness and compliance with the Hedera DID Method v2.0 specification. Use external cryptographic tools (e.g., `jose` libraries, online JWT debuggers) to validate signatures and key formats.