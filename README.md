# Hedera DID Method v2.0: Proof of Concept

Welcome\! This repository contains the **Proof of Concept (PoC)** implementations for the **[Hedera DID Method v2.0](https://github.com/Swiss-Digital-Assets-Institute/did-method)**. Its purpose is to demonstrate, test, and validate the core features of the v2.0 specification in a practical, hands-on manner.

The primary goal of the v2.0 specification is to fully align the `did:hedera` method with W3C DID Core standards by implementing a robust, controller-based authorization model secured by W3C Data Integrity proofs. These PoCs showcase how that can be achieved.

### Repository Contents

This repository provides the following key resources:
  - The [**PoC Plan**](https://github.com/Swiss-Digital-Assets-Institute/hashgraph-did-method-v2-poc/blob/main/POC-PLAN.md) that outlines the objectives, scope, and approach for these validation efforts.
  - Runnable **Proof of Concept (PoC) implementations** designed to validate key v2.0 features, such as controller functionality, key rotation, and support for various verification methods.
  - The **evolving specification document** for the [Hedera DID Method v2.0](https://github.com/Swiss-Digital-Assets-Institute/did-method), which serves as the technical foundation for the PoCs.
  - (Eventually) Test vectors and schema definitions for v2.0.

We encourage you to examine the PoC plan, run the PoC implementations, and review the specification to understand and contribute to the development of `did:hedera` v2.0.

-----

### Available Proof of Concepts (PoCs)

Below is a list of the PoC implementations included in this repository. Each one demonstrates and validates key features of the `did:hedera` v2.0 method.

| PoC Name                                   | Location                                         | Description                                                                                          | Run Command                                       |
| ------------------------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Create DID with Controller                 | `src/create-did-with-controller.ts`              | Create a DID with a single controller and assert its initial state.                                  | `npm run poc:create-did-with-controller`          |
| Update DID with Multiple Controllers       | `src/update-did-with-multiple-controller.ts`     | Create a DID with multiple controllers, update with different controllers, and assert state.         | `npm run poc:update-did-with-multiple-controller` |
| Update DID with JWK Verification Method    | `src/update-did-with-jwk-verification-method.ts` | Add a JWK-based verification method to a DID and assert the update.                                  | `npm run poc:jwk-verification-method`             |
| Remove Service and Method                  | `src/remove-service-and-method.ts`               | Remove services and a verification method from a DID and assert the result.                          | `npm run poc:remove-service-and-method`           |
| Deactivate DID (Self)                      | `src/deactivate-did-self.ts`                     | Deactivate a DID by its own controller and assert the DID is deactivated.                            | `npm run poc:deactivate-did-self`                 |
| Deactivate DID (Multi-Controller)          | `src/deactivate-did-multi-controller.ts`         | Deactivate a DID with multiple controllers using one of the controllers.                             | `npm run poc:deactivate-did-multi-controller`     |
| DID Controller Key Rotation                | `src/did-controller-key-rotation.ts`             | Demonstrates rotating the controller's key for a DID and making updates with the new controller key. | `npm run poc:did-controller-key-rotation`         |
| DID Key Rotation                           | `src/did-key-rotation.ts`                        | Demonstrates rotating the main authentication key for a DID and making updates with the new key.     | `npm run poc:did-key-rotation`                    |
| Embedded DID Controller                    | `src/embedded-did-controller.ts`                 | Demonstrates a DID where the controller's verification method is embedded in the DID document.       | `npm run poc:embedded-did-controller`             |
| Referenced DID Controller                  | `src/referenced-did-controller.ts`               | Demonstrates a DID where the controller's verification method is referenced from another DID.        | `npm run poc:referenced-did-controller`           |
| DID with Multikey Verification Method      | `src/did-with-multikey-vm.ts`                    | Create a DID using a Multikey verification method and assert the DID document state.                 | `npm run poc:did-with-multikey-vm`                |
| DID with Multikey BLS Verification Methods | `src/did-with-multikey-bls-vm.ts`                | Create a DID using BLS12-381 G1 and G2 verification methods and assert the DID document state.       | `npm run poc:did-with-multikey-bls-vm`            |

-----

### How to Run a PoC

1.  **Install dependencies:** Make sure you have installed all required packages (see `package.json`).

    ```bash
    npm install
    ```

2.  **Set up environment variables:** You need a Hedera Testnet account. Copy the `.env.sample` file to a new file named `.env` and fill in your account details:

    ```bash
    HEDERA_TESTNET_ACCOUNT_ID=...
    HEDERA_TESTNET_PRIVATE_KEY=...
    ```

3.  **Run a PoC:**
    You can use the provided npm scripts for each PoC, for example:

    ```bash
    npm run poc:create-did-with-controller
    ```