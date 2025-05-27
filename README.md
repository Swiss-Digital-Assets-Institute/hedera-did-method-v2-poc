# Hedera DID Method v2.0: Specification & Proof of Concept

Welcome to the repository for the **Hedera DID Method v2.0**. This space serves as the central hub for the development and validation of the next iteration of decentralized identifiers on Hedera.

Our primary goal with v2.0 is to fully align the `did:hedera` method with W3C DID Core standards, particularly by implementing a robust controller-based authorization model secured by W3C Data Integrity proofs.

**Inside this repository, you will find:**

- The **evolving specification document** for Hedera DID Method v2.0, detailing its architecture, operations, and security considerations.
- Runnable **Proof of Concept (PoC) implementations** designed to validate key v2.0 features. These PoCs demonstrate practical application of the core mechanisms, including:
  - Controller and multi-controller functionality.
  - Key rotation procedures.
  - Support for verification methods like `Multikey` and `JsonWebKey2020`.
- The **PoC Plan** that outlines the objectives, scope, and approach for these validation efforts.
- (Eventually) Test vectors and potentially schema definitions for v2.0.

We encourage you to explore the specification, examine the PoC plan, and run the PoC implementations (as they become available) to understand and contribute to the development of `did:hedera` v2.0.

### Available Proof of Concepts (PoCs)

Below is a list of currently available Proof of Concept (PoC) implementations included in this repository. Each PoC demonstrates and validates key features of the `did:hedera` v2.0 method.

| PoC Name                                | Location                                         | Description                                                                                          | Run Command                                       |
| --------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Create DID with Controller              | `src/create-did-with-controller.ts`              | Create a DID with a single controller and assert its initial state.                                  | `npm run poc:create-did-with-controller`          |
| Update DID with Multiple Controllers    | `src/update-did-with-multiple-controller.ts`     | Create a DID with multiple controllers, update with different controllers, and assert state.         | `npm run poc:update-did-with-multiple-controller` |
| Update DID with JWK Verification Method | `src/update-did-with-jwk-verification-method.ts` | Add a JWK-based verification method to a DID and assert the update.                                  | `npm run poc:jwk-verification-method`             |
| Remove Service and Method               | `src/remove-service-and-method.ts`               | Remove services and a verification method from a DID and assert the result.                          | `npm run poc:remove-service-and-method`           |
| Deactivate DID (Self)                   | `src/deactivate-did-self.ts`                     | Deactivate a DID by its own controller and assert the DID is deactivated.                            | `npm run poc:deactivate-did-self`                 |
| Deactivate DID (Multi-Controller)       | `src/deactivate-did-multi-controller.ts`         | Deactivate a DID with multiple controllers using one of the controllers.                             | `npm run poc:deactivate-did-multi-controller`     |
| DID Controller Key Rotation             | `src/did-controller-key-rotation.ts`             | Demonstrates rotating the controller's key for a DID and making updates with the new controller key. | `npm run poc:did-controller-key-rotation`         |
| DID Key Rotation                        | `src/did-key-rotation.ts`                        | Demonstrates rotating the main authentication key for a DID and making updates with the new key.     | `npm run poc:did-key-rotation`                    |
| Embedded DID Controller                 | `src/embedded-did-controller.ts`                 | Demonstrates a DID where the controller's verification method is embedded in the DID document.       | `npm run poc:embedded-did-controller`             |
| Referenced DID Controller               | `src/referenced-did-controller.ts`               | Demonstrates a DID where the controller's verification method is referenced from another DID.        | `npm run poc:referenced-did-controller`           |
| DID with Multikey Verification Method   | `src/did-with-multikey-vm.ts`                    | Create a DID using a Multikey verification method and assert the DID document state.                 | `npm run poc:did-with-multikey-vm`                |

#### How to Run

1. **Install dependencies:**  
   Make sure you have installed all required packages (see `package.json`).

2. **Set up environment variables:**  
   You need a Hedera Testnet account. Set the following environment variables:

   - `HEDERA_TESTNET_ACCOUNT_ID`
   - `HEDERA_TESTNET_PRIVATE_KEY`

3. **Run a PoC:**
   You can use the provided npm scripts for each PoC, for example:
   ```bash
   npm run poc:create-did-with-controller
   npm run poc:update-did-with-multiple-controller
   npm run poc:jwk-verification-method
   npm run poc:remove-service-and-method
   npm run poc:deactivate-did-self
   npm run poc:deactivate-did-multi-controller
   npm run poc:did-controller-key-rotation
   npm run poc:did-key-rotation
   npm run poc:embedded-did-controller
   npm run poc:referenced-did-controller
   npm run poc:did-with-multikey-vm
   ```
