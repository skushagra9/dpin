import dotenv from "dotenv";

dotenv.config();

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL;
const SOLANA_WS_URL = process.env.SOLANA_WS_URL;
const SOLANA_PUB_KEY = process.env.SOLANA_PUB_KEY;
const SOLANA_PRIV_KEY = process.env.SOLANA_PRIV_KEY;

const LOCAL_URL = process.env.LOCAL_URL;
const PROD_URL = process.env.PROD_URL;
const PRODUCTION = process.env.PRODUCTION === "true";

const WS_URL = PRODUCTION ? PROD_URL : LOCAL_URL;

export { SOLANA_RPC_URL, SOLANA_WS_URL, SOLANA_PUB_KEY, SOLANA_PRIV_KEY, WS_URL };