import { randomUUID } from "crypto";
import type { User } from "../models/user.model";

/**
 * In-memory user table used for the MVP backend implementation.
 * This can be replaced by a real database without changing callers.
 */
const usersById = new Map<string, User>();
const usersByWallet = new Map<string, User>();

/**
 * Create a new user record for the given wallet address.
 */
export function createUser(walletAddress: string): User {
  const now = new Date();
  const user: User = {
    id: randomUUID(),
    walletAddress,
    safeAddress: null,
    createdAt: now,
  };
  usersById.set(user.id, user);
  usersByWallet.set(walletAddress.toLowerCase(), user);
  return user;
}

/**
 * Find a user by wallet address, or return null if not found.
 */
export function findUserByWallet(walletAddress: string): User | null {
  return usersByWallet.get(walletAddress.toLowerCase()) ?? null;
}

/**
 * Persist a Safe address for the given user and return the updated record.
 */
export function updateUserSafeAddress(
  userId: string,
  safeAddress: string
): User {
  const existing = usersById.get(userId);
  if (!existing) {
    throw new Error(`User with id ${userId} not found`);
  }
  const updated: User = { ...existing, safeAddress };
  usersById.set(userId, updated);
  usersByWallet.set(updated.walletAddress.toLowerCase(), updated);
  return updated;
}

