import dotenv from "dotenv";

dotenv.config();

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
export const SOLANA_WS_URL = process.env.SOLANA_WS_URL;
export const SOLANA_PUB_KEY = process.env.SOLANA_PUB_KEY;
export const SOLANA_PRIV_KEY = process.env.SOLANA_PRIV_KEY;