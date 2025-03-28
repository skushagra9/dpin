import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { SOLANA_PRIV_KEY, SOLANA_PUB_KEY } from "./utils/ consts";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";
import { WS_URL } from "./utils/ consts";

const wss = new WebSocket(WS_URL as string);
let id: string;

wss.on("open", async() => {
    id = uuidv4();
    const message = await sendMessage(id);
    wss.send(JSON.stringify({ type: 'VALIDATION_REQUEST', payload: message }));
});

wss.on("message", async(message: any) => {
    try {
        const { type, payload } = JSON.parse(message.toString());
        console.log("type", type, payload);
        switch (type) {
            case 'VALIDATION_RESPONSE':
                if (payload.id === id) {
                    const result = await checkEndpoints(payload.urls);
                    console.log("result", result);
                    wss.send(JSON.stringify({ type: 'UPDATE', payload: { id, result, validatorId: payload.validatorId } }));
                }
                break;
            default:
                console.log('Unknown message type:', type);
        }
    } catch (error) {
        console.error(error);
    }
});

wss.on("error", (error) => {
    console.error(error);
});

const signMessage = async (uuid: string) => {
    
    const secretKeyArray: number[] = JSON.parse(SOLANA_PRIV_KEY as string);
    const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

    const message = "Authentication Request from " + uuid;
    const messageBytes = nacl_util.decodeUTF8(message);

    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signatureBase64 = Buffer.from(signature).toString('base64');

    return signatureBase64;
}

const checkEndpoints = async (urls: string[]) => {
    const result = [];
    for (const url of urls) {
        const startTime = Date.now();
        const response = await fetch(url);
        const elapsedTime = Date.now() - startTime;
        result.push({
            url,
            result:
            {
                status: response.status,
                result: response.ok,
                responseTime: elapsedTime
            }
        });
    }
    return result;
}

const sendMessage = async (id: string) => {
    const payload = {
        id: id,
        address: SOLANA_PUB_KEY,
        signature: await signMessage(id),
    }
    return payload;
}