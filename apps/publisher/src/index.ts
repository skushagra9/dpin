import WebSocket from "ws";
import getPrismaInstance from "@repo/database";
import { Keypair, PublicKey, SignaturePubkeyPair } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";


interface Monitor {
    id: string;
    url: string;
    userId: string;
    createdAt: Date;
}

interface Connection {
    callback: (payload: ResponsePayload) => void;
    timestamp: number;
}

interface UrlResult {
    status: number;
    result: boolean;
    responseTime: number;
}

interface ResponsePayload {
    results: {
        url: string,
        result: UrlResult
    }[];
    id: string
}

interface ValidationResponse {
    type: 'VALIDATION_RESPONSE';
    payload: {
        result: boolean;
        urls: string[];
        id: string;
    }
}

const prisma = getPrismaInstance();

const wss = new WebSocket.Server({ port: 8080 });


const requestMappings = new Map<string, Connection>();

wss.on("connection", async (ws) => {
    ws.on("message", async (message) => {
        try {
            const { type, payload } = JSON.parse(message.toString());
            switch (type) {
                case 'VALIDATION_REQUEST':
                    console.log(payload, "reached");
                    const result = await verifySignature(payload.address, payload.signature, payload.id);
                    const response: ValidationResponse = {
                        type: 'VALIDATION_RESPONSE',
                        payload: {
                            result,
                            urls: [],
                            id: payload.id
                        }
                    }
                    console.log(response, "response");
                    if (result) {
                        requestMappings.set(payload.id, {callback: async (responsePayload: ResponsePayload) => {
                            try {
                                const monitors = await prisma.monitor.findMany({
                                    where: {
                                        url: {
                                            in: responsePayload.results.map(r => r.url)
                                        }
                                    }
                                });

                                const resultsToCreate = monitors.map((monitor: Monitor) => {
                                    const urlResult = responsePayload.results.find(r => r.url === monitor.url)!;
                                    return {
                                        monitorId: monitor.id,
                                        validatorId: payload.id,
                                        responseTime: urlResult.result.responseTime,
                                        result: urlResult.result.result,
                                        status: urlResult.result.status,
                                    }
                                });

                                await prisma.$transaction([
                                    prisma.monitorResults.createMany({
                                        data: resultsToCreate
                                    })
                                ]);

                                const urls = await getEndpoints();
                                response.payload.urls = urls;
                            } catch (error) {
                                console.error('Error processing response:', error);
                            }
                        }, timestamp: Date.now()});
                    }
                    ws.send(JSON.stringify(response));
                    break;
                case 'UPDATE':
                    if (requestMappings.has(payload.id)) {
                        requestMappings.get(payload.id)!.callback(payload);
                    }
                    break;
                default:
                    console.log('Unknown message type:', type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    });
    ws.on("close", () => {
        console.log("Client disconnected");
    });
    ws.on("error", (error) => {
        console.error(error);
    });
});

wss.on("error", (error) => {
    console.error(error);
});

wss.on("listening", () => {
    console.log("Publisher is running on port 8080");
});

const checkInvalidConnections = async () => {
    requestMappings.forEach((connection, key) => {
        if (connection.timestamp < Date.now() - 1000 * 15) {
            requestMappings.delete(key);
        }
    })
};

const verifySignature = async (address: string, signature:string, id: string) => {
    const signatureUint8 = new Uint8Array(Buffer.from(signature, "base64"));
    const publicKey = new PublicKey(address);
    const message = "Authentication Request from " + id;
    const messageBytes = nacl_util.decodeUTF8(message);
    const result = nacl.sign.detached.verify(
        messageBytes,
        signatureUint8,
        publicKey.toBytes(),
    );
    return result;
}

const getEndpoints = async (): Promise<string[]> => {
    const endpoints = await prisma.monitor.findMany({
    });
    const urls = endpoints.map((endpoint: Monitor) =>  endpoint.url);
    console.log(urls);
    return urls;
};

setInterval(checkInvalidConnections, 1000 * 15);