import axios from "axios";
import type { AxiosInstance } from "axios";
import { ethers } from "ethers";
import { loadConfig } from "../config/env";

/**
 * Ticker data from Aster Futures API.
 */
export interface AsterTicker {
  symbol: string;
  markPrice: number;
  indexPrice: number;
  timestamp: number;
}

/**
 * Parameters for placing an order on Aster.
 */
export interface AsterOrderParams {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT";
  sizeUsd: number;
  price?: number;
}

/**
 * Result of placing an order on Aster.
 */
export interface AsterOrderResult {
  orderId: string;
  status: "NEW" | "FILLED" | "PARTIALLY_FILLED" | "REJECTED";
}

/**
 * Authentication payload required by Aster API for signed requests.
 */
interface AsterAuth {
  nonce: string;
  user: string;
  signer: string;
  signature: string;
}

const config = loadConfig();
let httpClient: AxiosInstance | null = null;

/**
 * Get or create the HTTP client for Aster API requests.
 */
function getAsterClient(): AxiosInstance {
  if (!httpClient) {
    httpClient = axios.create({
      baseURL: config.asterBaseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  return httpClient;
}

/**
 * Build and sign the Aster Web3 authentication payload using EIP-712 typed data.
 * The agent wallet private key is used to sign on behalf of the logical user.
 */
async function buildAuth(userAddress: string): Promise<AsterAuth> {
  const wallet = new ethers.Wallet(config.asterAgentPrivateKey);
  const nonce = Date.now().toString();

  // EIP-712 typed data structure for Aster authentication
  // Adjust domain and types according to Aster's actual spec
  const domain = {
    name: "AsterDex",
    version: "1",
    chainId: config.chainId,
    verifyingContract: config.asterAgentAddress, // or a specific contract address if Aster uses one
  };

  const types = {
    Auth: [
      { name: "nonce", type: "string" },
      { name: "user", type: "address" },
      { name: "signer", type: "address" },
    ],
  };

  const value = {
    nonce,
    user: userAddress,
    signer: config.asterAgentAddress,
  };

  const signature = await wallet.signTypedData(domain, types, value);

  return {
    nonce,
    user: userAddress,
    signer: config.asterAgentAddress,
    signature,
  };
}

/**
 * Fetch latest ticker/price data for a futures symbol from Aster.
 */
export async function getTicker(symbol: string): Promise<AsterTicker> {
  const client = getAsterClient();
  try {
    // Adjust endpoint path based on Aster API documentation
    const response = await client.get(`/ticker?symbol=${symbol}`);
    const data = response.data;

    return {
      symbol: data.symbol || symbol,
      markPrice: parseFloat(data.markPrice || data.price || "0"),
      indexPrice: parseFloat(data.indexPrice || data.price || "0"),
      timestamp: data.timestamp || Date.now(),
    };
  } catch (error: any) {
    throw new Error(
      `Failed to fetch ticker for ${symbol}: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Place a futures order on Aster for a logical end user, signed by the agent API wallet.
 */
export async function placeOrder(
  userAddress: string,
  params: AsterOrderParams
): Promise<AsterOrderResult> {
  const client = getAsterClient();
  const auth = await buildAuth(userAddress);

  const orderPayload = {
    ...auth,
    symbol: params.symbol,
    side: params.side,
    type: params.type,
    sizeUsd: params.sizeUsd,
    ...(params.price && { price: params.price }),
  };

  try {
    // Adjust endpoint path based on Aster API documentation
    const response = await client.post("/order", orderPayload);
    const data = response.data;

    return {
      orderId: data.orderId || data.id || `order_${Date.now()}`,
      status: (data.status || "NEW") as AsterOrderResult["status"],
    };
  } catch (error: any) {
    throw new Error(
      `Failed to place order: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Fetch current open positions for this agent on behalf of a user/session.
 * Returns an array of position objects (structure depends on Aster API).
 */
export async function getPositions(userAddress: string): Promise<any[]> {
  const client = getAsterClient();
  const auth = await buildAuth(userAddress);

  try {
    // Adjust endpoint path based on Aster API documentation
    const response = await client.get("/positions", {
      params: auth,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    // If positions endpoint doesn't exist or fails, return empty array
    console.warn(`Failed to fetch positions: ${error.message}`);
    return [];
  }
}

/**
 * Fetch available markets from Aster.
 */
export async function getMarkets(): Promise<string[]> {
  const client = getAsterClient();
  try {
    const response = await client.get("/markets");
    const data = response.data;
    // Adjust based on Aster API response structure
    if (Array.isArray(data)) {
      return data.map((m: any) => m.symbol || m);
    }
    if (data.markets && Array.isArray(data.markets)) {
      return data.markets.map((m: any) => m.symbol || m);
    }
    return [];
  } catch (error: any) {
    console.warn(`Failed to fetch markets: ${error.message}`);
    return ["BTCUSDT_PERP", "ETHUSDT_PERP"]; // fallback for MVP
  }
}
