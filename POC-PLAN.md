## Hedera DID v2.0 Proof-of-Concept Plan

### Description

This Proof-of-Concept (PoC) plan outlines the validation of key features within the Hedera DID Method v2.0 specification, specifically targeting the **controller and proof model (including ownership transfer, revocation, and threshold control)**, **key rotation**, and **specified verification methods (including `Multikey`, `JsonWebKey2020`, and BLS for threshold signatures)**. It details the PoC's objectives, scope, technical approach, and validation methods.

### Objectives

1.  **Validate the Controller and Proof Model**: Ensure the DID method effectively supports single and multi-controller operations, **DID ownership transfer, DID revocation,** and enforceable permissions, including **threshold control**.
2.  **Demonstrate Secure Key Rotation**: Illustrate a secure key rotation process for controller keys without disrupting DID resolution.
3.  **Verify Verification Methods**: Test the implementation and functionality of specified verification methods (e.g., **`Multikey`, `JsonWebKey2020`,** and BLS keys for threshold signature schemes).
4.  **Ensure Compliance**: Confirm all implementations align with the Hedera DID Method v2.0 specification.

### Scope

This PoC will validate the following Hedera DID Method v2.0 features:

* **Single-controller DID operations**: Creation, updates, deactivation, and resolution.
* **Multi-controller DID operations**: Creation, updates, deactivation, and resolution, including scenarios with threshold signatures.
* **Key Rotation**: Secure rotation of controller keys.
* **DID Owner Transfer**: Mechanisms for securely transferring primary DID control.
* **DID Revocation**: Processes for permanently revoking a DID.
* **BLS-based Threshold Signature Control**: Using BLS keys for m-of-n signature control over DID operations.
* **Verification Methods**: Implementation and validation of **`Multikey`, `JsonWebKey2020`,** BLS keys for threshold control, and other specified verification methods.

### Success Criteria

1.  **Functional Validation**:
    * DID documents correctly resolve after all operations (creation, updates, deactivation, **owner transfer, revocation**).
    * Key rotation processes successfully without disrupting existing DID references or resolution.
    * Verification methods (**including `Multikey` and `JsonWebKey2020`**) are correctly implemented and cryptographically verifiable through manual inspection and tool-assisted analysis.
    * Controller permissions and signature thresholds (including generic and **BLS-based**) are enforced as expected, confirmed via manual testing.
    * **DID ownership transfer is secure and verifiable through manual checks.**
    * **DID revocation is permanent and clearly reflected, as verified manually.**
    * **BLS-based threshold signature schemes are correctly implemented, enabling m-of-n control over DIDs, with verifiable aggregated signatures confirmed manually.**
2.  **Performance Metrics**:
    * DID operations (creation, update, resolution, deactivation) complete within acceptable latency parameters (e.g., under 5 seconds for Hedera consensus finality), observed during manual execution.
3.  **Compliance**:
    * All implemented features, upon manual verification, demonstrate alignment with the Hedera DID Method v2.0 specification.

### Technical Approach

1.  **Hedera Hashgraph SDK**: Utilize the official Hedera Hashgraph SDK for all DID document transactions on the Hedera network.
2.  **TypeScript/Node.js**: Develop PoC logic in `TypeScript` with `Node.js` for type safety and modularity.
3.  **Local Network**: Deploy and utilize a local Hedera testnet environment for validation.

### Dependencies

1.  **Hedera Testnet Access**: Requires a local or testnet Hedera network with funded accounts.
2.  **SDK Updates**: Ensure compatibility with the latest Hedera SDK version.
3.  **Cryptographic Libraries**: Utilize robust cryptographic libraries for handling **`Multikey` representations, `JsonWebKey2020` (e.g., using `jose`),** BLS signature aggregation, and other specified verification methods.

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

#### 4. Verification Methods (featuring `Multikey` and `JsonWebKey2020`)

* **Objective**: Validate the implementation, functionality, and cryptographic verifiability of `Multikey` and `JsonWebKey2020` verification methods.
* **Steps**:
    1.  Add a `JsonWebKey2020` verification method to an existing DID document (e.g., for an `ES256K` key).
    2.  Create a signature using the private key corresponding to the `JsonWebKey2020` method.
    3.  Verify the signature against the public key in the `JsonWebKey2020` method retrieved from the resolved DID document.
    4.  Add a `Multikey` verification method to a DID document, representing a public key in `publicKeyMultibase` format.
    5.  Resolve the DID and verify the correct interpretation of the `Multikey` public key material.
    6.  If the key material in `Multikey` corresponds to a signature algorithm also testable (e.g., if it's the same key as used in step 1, just differently encoded), attempt a signature verification using the key resolved via the `Multikey` method.
* **Success Criteria**:
    * `Multikey` and `JsonWebKey2020` verification methods can be successfully added to, resolved from, and correctly interpreted from a DID document.
    * Public keys are correctly represented in both `JsonWebKey2020` (JWK format) and `Multikey` (`publicKeyMultibase` format).
    * Signatures created using keys associated with `JsonWebKey2020` are cryptographically verifiable.
    * Keys retrieved via `Multikey` can be used for cryptographic operations as appropriate to the key type.
* **Relevant PoC(s)**:
    * (Placeholder: `src/verification-methods.ts` Run: `npm run poc:verification-methods`) - Demonstrates adding and using `Multikey` and `JsonWebKey2020` verification methods.

#### 5. DID Owner Transfer

* **Objective**: Validate the secure transfer of DID ownership or primary control.
* **Steps**:
    1.  Identify a DID and its current controller(s) responsible for ownership.
    2.  Initiate the ownership transfer process to a new controller entity/key.
    3.  Ensure the process requires proper authorization from the current owner(s)/controller(s) as defined by the DID method.
    4.  Verify that upon successful transfer, the new controller/key gains primary control and the previous controller's/key's ownership rights are appropriately updated or revoked.
    5.  Resolve the DID and confirm the DID document accurately reflects the updated controller or ownership status.
* **Success Criteria**:
    * DID control/ownership is verifiably transferred to the new entity/key.
    * The previous controller's/key's specific ownership privileges are demonstrably changed or revoked.
    * The resolved DID document accurately reflects the new controller or ownership status.
    * The transfer process adheres to the security requirements of the DID method.
* **Relevant PoC(s)**:
    * (Placeholder: `src/transfer-did-ownership.ts` Run: `npm run poc:transfer-did`)

#### 6. DID Revocation

* **Objective**: Validate the permanent revocation or deactivation of a DID, ensuring its status is clearly and irreversibly marked.
* **Steps**:
    1.  Select an active DID.
    2.  Initiate the revocation/deactivation process by its authorized controller(s).
    3.  Verify that the DID's resolved state clearly indicates it is revoked/deactivated (e.g., through a specific property or status).
    4.  Attempt to use the revoked/deactivated DID for an operation that requires an active DID (e.g., authentication, update) and verify that the operation is handled appropriately (e.g., fails or is recognized as pertaining to a revoked DID).
* **Success Criteria**:
    * The DID is verifiably and permanently marked as revoked/deactivated according to the method's specification.
    * The resolved DID document clearly and unambiguously indicates its revoked/deactivated status.
    * Attempts to use the DID for operations requiring an active state are appropriately handled.
* **Relevant PoC(s)**:
    * (Placeholder: `src/revoke-did.ts` Run: `npm run poc:revoke-did`)

#### 7. DID Control with BLS-based Threshold Signatures

* **Objective**: Validate the use of BLS keys and signature aggregation for m-of-n threshold control over DID operations.
* **Steps**:
    1.  Create or update a DID to define a control mechanism that relies on an m-of-n threshold of BLS signatures (e.g., 2-of-3 BLS keys are required to authorize an update). This involves associating multiple BLS public keys with the DID for this purpose.
    2.  Attempt a significant DID operation (e.g., adding a new service endpoint or changing a verification method) that is governed by this BLS threshold policy.
    3.  Generate 'm' valid partial BLS signatures for the operation using 'm' distinct private BLS keys corresponding to the registered public keys.
    4.  Aggregate these 'm' partial BLS signatures into a single, compact aggregated BLS signature.
    5.  Use the aggregated BLS signature to authorize the DID operation.
    6.  Verify that the operation succeeds and the DID document is updated correctly when a valid aggregated signature meeting the threshold is provided.
    7.  Verify that the operation fails if fewer than 'm' partial signatures are used, if any partial signature is invalid, or if the aggregation is incorrect.
* **Success Criteria**:
    * DIDs can be successfully configured for m-of-n threshold control using multiple BLS keys.
    * Valid aggregated BLS signatures, meeting the defined m-of-n threshold, successfully authorize DID operations.
    * Operations explicitly fail if the BLS signature threshold is not met with valid, correctly aggregated partial signatures.
    * The DID document accurately reflects the BLS public keys and the associated threshold policy for its control mechanism.
* **Relevant PoC(s)**:
    * (Placeholder: `src/did-bls-threshold-control.ts` Run: `npm run poc:bls-threshold-did`)

### Validation Methodology

1.  **Manual Verification**: Manually inspect resolved DID documents for structural correctness and compliance with the Hedera DID Method v2.0 specification. Use external cryptographic tools (e.g., `jose` libraries, online JWT debuggers, BLS signature utilities) to validate signatures, keys, and threshold mechanisms.