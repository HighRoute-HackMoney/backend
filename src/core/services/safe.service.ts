import { createUser, findUserByWallet, updateUserSafeAddress } from "../db/user.repo";

/**
 * Ensure that there is a Safe smart account on BNB testnet for the given wallet.
 * For the MVP, this implementation stubs Safe deployment and derives a pseudo address.
 */
export async function ensureSafeForWallet(walletAddress: string): Promise<{
  safeAddress: string;
  network: "bsc-testnet";
  status: "created" | "existing";
}> {
  let user = findUserByWallet(walletAddress);
  if (!user) {
    user = createUser(walletAddress);
  }

  if (user.safeAddress) {
    return {
      safeAddress: user.safeAddress,
      network: "bsc-testnet",
      status: "existing",
    };
  }

  // TODO: replace this stub with a real Safe deployment on BNB testnet.
  const pseudoSafeAddress = buildPseudoSafeAddress(walletAddress);
  updateUserSafeAddress(user.id, pseudoSafeAddress);

  return {
    safeAddress: pseudoSafeAddress,
    network: "bsc-testnet",
    status: "created",
  };
}

/**
 * Query the balances of key assets held in the given Safe address.
 * Currently returns mocked values for the MVP.
 */
export async function getSafeBalances(safeAddress: string): Promise<{
  safeAddress: string;
  network: "bsc-testnet";
  balances: { symbol: string; amount: string }[];
}> {
  // TODO: integrate with BNB testnet RPC and ERC20 contracts for real balances.
  return {
    safeAddress,
    network: "bsc-testnet",
    balances: [
      { symbol: "BNB", amount: "0.0" },
      { symbol: "USDT", amount: "0.0" },
    ],
  };
}

/**
 * Create a deterministic pseudo Safe address from the user's wallet address.
 * This is only for demo purposes and must be replaced with a real Safe address.
 */
function buildPseudoSafeAddress(walletAddress: string): string {
  const normalized = walletAddress.toLowerCase().replace(/^0x/, "");
  const padded = (normalized + "0000000000000000000000000000000000000000").slice(
    0,
    40
  );
  return `0x${padded}`;
}

