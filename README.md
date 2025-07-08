# Hedera DID Method v2.0: Proof of Concept

Welcome\! This repository contains the **Proof of Concept (PoC)** implementations for the **[Hedera DID Method v2.0](https://github.com/Swiss-Digital-Assets-Institute/did-method)**. Its purpose is to demonstrate, test, and validate the core features of the v2.0 specification in a practical, hands-on manner.

The primary goal of the v2.0 specification is to fully align the `did:hedera` method with W3C DID Core standards by implementing a robust, controller-based authorization model secured by W3C Data Integrity proofs. These PoCs showcase how that can be achieved.

### Repository Contents

This repository provides the following key resources:

- The [**PoC Plan**](./POC-PLAN.md) that outlines the objectives, scope, and approach for these validation efforts.
- Runnable **Proof of Concept (PoC) implementations** designed to validate key v2.0 features, such as controller functionality, key rotation, and support for various verification methods.
- The **evolving specification document** for the [Hedera DID Method v2.0](https://github.com/Swiss-Digital-Assets-Institute/did-method), which serves as the technical foundation for the PoCs.
- (Eventually) Test vectors and schema definitions for v2.0.

We encourage you to examine the PoC plan, run the PoC implementations, and review the specification to understand and contribute to the development of `did:hedera` v2.0.

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
