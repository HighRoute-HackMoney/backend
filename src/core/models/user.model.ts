/**
 * Represents an authenticated user identified by a wallet address.
 */
export interface User {
  /** Unique database identifier for this user. */
  id: string;
  /** EVM wallet address from Privy (BNB testnet). */
  walletAddress: string;
  /** Safe smart account address on BNB testnet, if created. */
  safeAddress: string | null;
  /** Timestamp when the user was first seen. */
  createdAt: Date;
}

