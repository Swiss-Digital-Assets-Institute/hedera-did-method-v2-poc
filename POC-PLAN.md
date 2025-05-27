## Hedera DID v2.0 Proof-of-Concept Plan

### Introduction

This document presents the Proof-of-Concept (PoC) plan for validating key features of the Hedera DID Method v2.0 specification. It details the objectives, scope, technical approach, validation methods, and specific subtasks for these PoCs.

### Description

The plan focuses on the controller model (encompassing single and multi-controller scenarios, and deactivation), key rotation mechanisms (for controllers and DID subjects), and designated verification methods such as `Multikey` and `JsonWebKey2020`. The plan also addresses various representations of controllers within DID documents.

### Objectives

The primary objectives of this PoC plan are to:

1.  **Validate the controller model**: Confirm effective support for single and multi-controller operations, as well as DID deactivation.
2.  **Demonstrate secure key rotation**: Showcase secure rotation processes for controller keys and DID subject keys, ensuring no disruption to DID resolution.
3.  **Verify verification methods**: Test the implementation and functionality of designated verification methods, including `Multikey` and `JsonWebKey2020`.
4.  **Validate controller representation**: Confirm support for embedded and referenced DID controllers within DID documents.
5.  **Ensure compliance**: Verify that all implemented features align with the Hedera DID Method v2.0 specification.

### Scope

This PoC will validate the following Hedera DID Method v2.0 features:

* **Single-controller DID operations**: Including creation, updates, deactivation, and resolution.
* **Multi-controller DID operations**: Including creation, updates involving multiple controllers, deactivation, and resolution.
* **Controller Key Rotation**: Covering secure rotation of controller keys.
* **DID Subject Key Rotation**: Covering secure rotation of a DID's main authentication keys.
* **DID Deactivation**: Covering processes for deactivating DIDs by their controller(s).
* **Verification Methods**: Focusing on the implementation and validation of `Multikey` and `JsonWebKey2020`.
* **Controller Representation**: Addressing support for embedded controller verification methods and the referencing of controllers from other DIDs.

### Success Criteria

Successful completion of this PoC will be determined by the following criteria:

1.  **Functional Validation**:
    * Accurate resolution of DID documents after all operations (creation, updates, deactivation).
    * Successful completion of key rotation processes (controller and DID subject) without disrupting existing DID references or resolution.
    * Correct implementation and cryptographic verifiability of verification methods (including `Multikey` and `JsonWebKey2020`), confirmed through manual inspection and tool-assisted analysis.
    * Expected enforcement of controller permissions, confirmed through manual testing of single and multi-controller scenarios.
    * Effective processing and clear reflection of DID deactivation, verified manually.
    * Accurate representation of embedded and referenced controllers in DID documents.
2.  **Performance Metrics**:
    * Completion of DID operations (creation, update, resolution, deactivation) within acceptable latency parameters (e.g., under 5 seconds for Hedera consensus finality), as observed during manual execution.
3.  **Compliance**:
    * Demonstrated alignment of all implemented features with the Hedera DID Method v2.0 specification, confirmed through manual verification.

### Technical Approach

1.  **Hedera Hashgraph SDK**: The official Hedera Hashgraph SDK will be utilized for all DID document transactions on the Hedera network.
2.  **TypeScript/Node.js**: The PoC logic will be developed in `TypeScript` with `Node.js` to ensure type safety and modularity.
3.  **Local Network**: A local Hedera testnet environment will be deployed and utilized for validation purposes.

### Dependencies

1.  **Hedera Testnet Access**: Access to a local or testnet Hedera network with funded accounts is required.
2.  **SDK Updates**: Compatibility with the latest Hedera SDK version must be ensured.
3.  **Cryptographic Libraries**: Robust cryptographic libraries will be utilized for handling `Multikey` representations and `JsonWebKey2020` (e.g., using `jose`).

### PoC Subtasks

The following subtasks will be executed to achieve the PoC objectives:

#### 1. Single-Controller DID Operations

* **Objective**: To validate the fundamental DID lifecycle operations (creation, update, resolution, deactivation) when managed by a single controller.
* **Steps**:
    1.  Create a new DID document with a single controller.
    2.  Update the DID document by adding or removing verification methods and services.
    3.  Deactivate the DID using its designated controller.
    4.  Resolve the DID at each stage (post-creation, post-update, post-deactivation) and verify the document's integrity and status.
* **Success Criteria**:
    * The DID document accurately reflects all creation, update, and deactivation operations.
    * All controller operations are cryptographically signed by the controller and are verifiable.
    * DID resolution remains accurate and consistent throughout its lifecycle.
* **Relevant PoC(s)**:
    * `src/create-did-with-controller.ts` (Run: `npm run poc:create-did-with-controller`)
    * `src/remove-service-and-method.ts` (Run: `npm run poc:remove-service-and-method`)
    * `src/deactivate-did-self.ts` (Run: `npm run poc:deactivate-did-self`)

#### 2. Multi-Controller DID Operations

* **Objective**: To validate DID operations that involve multiple controllers.
* **Steps**:
    1.  Create a DID with multiple controllers.
    2.  Perform updates that involve different configurations of these multiple controllers.
    3.  Deactivate a DID that has multiple controllers using one of the authorized controllers.
    4.  Resolve the DID and verify that the document and controller rules are correctly applied.
* **Success Criteria**:
    * Updates involving multiple controllers are correctly processed and reflected in the resolved DID document.
    * Deactivation by one of the authorized multiple controllers is successful.
    * Resolved DID documents accurately represent multi-controller permissions and states.
* **Relevant PoC(s)**:
    * `src/update-did-with-multiple-controller.ts` (Run: `npm run poc:update-did-with-multiple-controller`)
    * `src/deactivate-did-multi-controller.ts` (Run: `npm run poc:deactivate-did-multi-controller`)

#### 3. DID Controller Key Rotation

* **Objective**: To validate the secure rotation of controller keys without interrupting DID resolution or invalidating the DID.
* **Steps**:
    1.  Initiate the key rotation process for an existing controller key of a DID.
    2.  Verify that the old controller key is invalidated and can no longer authorize changes to the DID document.
    3.  Confirm that the new controller key can successfully authorize changes.
    4.  Ensure DID resolution remains uninterrupted and reflects the new controller key in the updated DID document.
* **Success Criteria**:
    * Attempts to use old controller keys for signing updates post-rotation fail.
    * New controller keys successfully sign updates.
    * The resolved DID document includes the new controller key and associated metadata.
    * DID resolution is consistently successful before, during, and after controller key rotation.
* **Relevant PoC(s)**:
    * `src/did-controller-key-rotation.ts` (Run: `npm run poc:did-controller-key-rotation`)

#### 4. DID Subject Key Rotation

* **Objective**: To validate the secure rotation of a DID's primary authentication keys without interrupting DID resolution.
* **Steps**:
    1.  Initiate the key rotation process for a DID's main authentication key (e.g., a key listed in `verificationMethod` and used for `authentication`).
    2.  Verify that the old key is no longer considered the primary authentication key or is updated/removed as per the rotation logic.
    3.  Confirm that the new key can be used for operations requiring authentication by the DID subject.
    4.  Ensure DID resolution reflects the updated key material in the DID document.
* **Success Criteria**:
    * Operations requiring the old authentication key (if it's meant to be invalidated for that purpose) fail or are handled according to the DID method's rules for key rotation.
    * The new authentication key is successfully used for DID subject operations.
    * The resolved DID document accurately reflects the updated key material.
* **Relevant PoC(s)**:
    * `src/did-key-rotation.ts` (Run: `npm run poc:did-key-rotation`)

#### 5. Verification Methods (featuring `Multikey` and `JsonWebKey2020`)

* **Objective**: To validate the implementation, functionality, and cryptographic verifiability of the `Multikey` and `JsonWebKey2020` verification methods.
* **Steps**:
    1.  Add a `JsonWebKey2020` verification method to an existing DID document.
    2.  Resolve the DID and verify the correct representation of the `JsonWebKey2020` method.
    3.  Create a DID with a `Multikey` verification method.
    4.  Resolve the DID and verify the correct interpretation of the `Multikey` public key material.
* **Success Criteria**:
    * `Multikey` and `JsonWebKey2020` verification methods can be successfully added to, resolved from, and correctly interpreted from a DID document.
    * Public keys are correctly represented in both `JsonWebKey2020` (JWK format) and `Multikey` (`publicKeyMultibase` format).
* **Relevant PoC(s)**:
    * `src/update-did-with-jwk-verification-method.ts` (Run: `npm run poc:jwk-verification-method`)
    * `src/did-with-multikey-vm.ts` (Run: `npm run poc:did-with-multikey-vm`)

#### 6. DID Deactivation

* **Objective**: To validate the DID deactivation process, ensuring the DID's status is clearly and accurately marked.
* **Steps**:
    1.  Select an active DID with a single controller. Initiate the deactivation process by its controller.
    2.  Select an active DID with multiple controllers. Initiate the deactivation process using one of the authorized controllers.
    3.  Verify that the DID's resolved state clearly indicates it is deactivated (e.g., through a specific property or status as defined by the method).
* **Success Criteria**:
    * The DID is verifiably marked as deactivated according to the method's specification.
    * The resolved DID document clearly and unambiguously indicates its deactivated status.
* **Relevant PoC(s)**:
    * `src/deactivate-did-self.ts` (Run: `npm run poc:deactivate-did-self`)
    * `src/deactivate-did-multi-controller.ts` (Run: `npm run poc:deactivate-did-multi-controller`)

#### 7. Controller Representation in DID Document

* **Objective**: To validate different methods for representing controller verification methods within a DID document, specifically focusing on embedded and referenced controllers.
* **Steps**:
    1.  Create/update a DID where the controller's verification method is directly embedded within the DID document itself.
    2.  Resolve this DID and verify the embedded controller representation.
    3.  Create/update a DID where the controller's verification method is referenced from another DID document.
    4.  Resolve this DID and verify the referenced controller representation, potentially requiring resolution of the controller's DID.
* **Success Criteria**:
    * DID documents can successfully represent controllers whose verification methods are embedded.
    * DID documents can successfully represent controllers whose verification methods are referenced from another DID.
    * Resolution of DIDs with embedded or referenced controllers is successful, and the controller information is correctly interpreted.
* **Relevant PoC(s)**:
    * `src/embedded-did-controller.ts` (Run: `npm run poc:embedded-did-controller`)
    * `src/referenced-did-controller.ts` (Run: `npm run poc:referenced-did-controller`)

### Validation Methodology

Validation will be conducted through manual inspection of resolved DID documents to verify structural correctness and compliance with the Hedera DID Method v2.0 specification. External cryptographic tools (such as `jose` libraries and online JWT debuggers) will be utilized to validate signatures and keys where applicable.