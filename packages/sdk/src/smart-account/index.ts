/**
 * @she-raksha/sdk — Smart Account Module
 * ERC-4337 Account Abstraction, Web3Auth MPC, and WebAuthn Passkey clients.
 */

export * from './types.js';
export { PasskeyWebAuthnProvider } from './passkeyProvider.js';
export { UserOpBuilder } from './userOpBuilder.js';
export { BundlerClient } from './bundlerClient.js';
export { SmartAccountClient, type SmartAccountClientConfig } from './client.js';

