import dotenv from "dotenv";

/**
 * Strongly typed configuration options required by the backend service.
 */
export interface AppConfig {
  /** HTTP port that the backend server listens on. */
  port: number;
  /** Node environment flag to switch log levels and behaviors. */
  nodeEnv: "development" | "production" | "test";
  /** Chain ID for BNB testnet. */
  chainId: number;
  /** RPC URL for interacting with BNB testnet. */
  rpcUrlBscTestnet: string;
  /** Base URL for the Aster Futures API. */
  asterBaseUrl: string;
  /** Private key for the Aster agent API wallet. */
  asterAgentPrivateKey: string;
  /** Public address for the Aster agent API wallet. */
  asterAgentAddress: string;
  /** WebSocket endpoint for Yellow Nitrolite. */
  yellowWsEndpoint: string;
  /** Base URL for communicating with the OpenClaw agent service. */
  agentServiceBaseUrl: string;
}

/**
 * Load and validate environment variables needed by the backend.
 * This function fails fast if required configuration is missing.
 */
export function loadConfig(): AppConfig {
  dotenv.config();

  const port = parseInt(process.env.PORT ?? "3000", 10);
  const nodeEnvRaw = (process.env.NODE_ENV ?? "development") as
    | "development"
    | "production"
    | "test";
  const chainId = parseInt(process.env.CHAIN_ID ?? "97", 10);

  const rpcUrlBscTestnet = process.env.RPC_URL_BSC_TESTNET;
  const asterBaseUrl = process.env.ASTER_BASE_URL;
  const asterAgentPrivateKey = process.env.ASTER_AGENT_WALLET_PRIVATE_KEY;
  const asterAgentAddress = process.env.ASTER_AGENT_ADDRESS;
  const yellowWsEndpoint = process.env.YELLOW_WS_ENDPOINT;
  const agentServiceBaseUrl = process.env.AGENT_SERVICE_BASE_URL;

  // In development mode, allow placeholder values for read-only endpoints
  // These will still be required for endpoints that need them (e.g., session management)
  if (nodeEnvRaw === "development") {
    // Allow placeholder values in development for basic API functionality
    if (!rpcUrlBscTestnet) {
      console.warn("⚠️  RPC_URL_BSC_TESTNET not set, using placeholder");
      rpcUrlBscTestnet = "https://data-seed-prebsc-1-s1.binance.org:8545/";
    }
    if (!asterBaseUrl) {
      console.warn("⚠️  ASTER_BASE_URL not set, using placeholder");
      asterBaseUrl = "https://api.aster.futures.example.com";
    }
    if (!asterAgentPrivateKey) {
      console.warn("⚠️  ASTER_AGENT_WALLET_PRIVATE_KEY not set, using placeholder");
      asterAgentPrivateKey = "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
    if (!asterAgentAddress) {
      console.warn("⚠️  ASTER_AGENT_ADDRESS not set, using placeholder");
      asterAgentAddress = "0x0000000000000000000000000000000000000000";
    }
    if (!yellowWsEndpoint) {
      console.warn("⚠️  YELLOW_WS_ENDPOINT not set, using placeholder");
      yellowWsEndpoint = "wss://yellow.nitrolite.example.com/ws";
    }
    if (!agentServiceBaseUrl) {
      console.warn("⚠️  AGENT_SERVICE_BASE_URL not set, using placeholder");
      agentServiceBaseUrl = "http://localhost:3001";
    }
  } else {
    // In production, all environment variables are required
    if (!rpcUrlBscTestnet) throw new Error("RPC_URL_BSC_TESTNET is required");
    if (!asterBaseUrl) throw new Error("ASTER_BASE_URL is required");
    if (!asterAgentPrivateKey)
      throw new Error("ASTER_AGENT_WALLET_PRIVATE_KEY is required");
    if (!asterAgentAddress) throw new Error("ASTER_AGENT_ADDRESS is required");
    if (!yellowWsEndpoint) throw new Error("YELLOW_WS_ENDPOINT is required");
    if (!agentServiceBaseUrl)
      throw new Error("AGENT_SERVICE_BASE_URL is required");
  }

  return {
    port,
    nodeEnv: nodeEnvRaw,
    chainId,
    rpcUrlBscTestnet,
    asterBaseUrl,
    asterAgentPrivateKey,
    asterAgentAddress,
    yellowWsEndpoint,
    agentServiceBaseUrl,
  };
}

