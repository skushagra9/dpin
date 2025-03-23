import WebSocket from "ws";
import getPrismaInstance from "@repo/database";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";
import { Connection, Monitor, ResponsePayload, ValidationResponse } from "./types";

interface ValidatedClient extends WebSocket {
    id: string;
    validatorId: string;
}

const INVALID_CONNECTION_TIMEOUT = 1000 * 15;
const DISTRIBUTE_INTERVAL = 1000 * 10;
const MAX_URLS_PER_VALIDATOR = 3;
const SOLANA_REWARD_AMOUNT = 100;

const prisma = getPrismaInstance();

const wss = new WebSocket.Server({ port: 8080 });


const requestMappings = new Map<string, Connection>();

wss.on("connection", async (ws: ValidatedClient) => {
    ws.on("message", async (message) => {
        try {
            const { type, payload } = JSON.parse(message.toString());
            switch (type) {
                case 'VALIDATION_REQUEST':
                    console.log(payload, "reached");
                    const result = await verifySignature(payload.address, payload.signature, payload.id);
                    
                    if (result) {
                        const validator = await prisma.validator.findFirst({
                            where: {
                                address: payload.address
                            }
                        });

                        ws.id = payload.id;
                        ws.validatorId = validator?.id as string;

                        if (!validator) {
                            await prisma.validator.create({
                                data: {
                                    address: payload.address
                                }
                            });
                        }
                        requestMappings.set(payload.id, {
                            callback: async (responsePayload: ResponsePayload) => {
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
                                            validatorId: responsePayload.validatorId,
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

                                    await prisma.validator.update({
                                        where: {
                                            id: responsePayload.validatorId
                                        },
                                        data: { balance: validator!.balance + SOLANA_REWARD_AMOUNT } 

                                    });

                                } catch (error) {
                                    console.error('Error processing response:', error);
                                }
                            }, timestamp: Date.now()
                        });
                    }
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


const distributeRequests = async () => {
   try {
        const endpoints = await getEndpoints();
        const activeClients = Array.from(wss.clients)
        .filter((client) => {
            const validatedClient = client as ValidatedClient;
            return validatedClient.readyState === WebSocket.OPEN && 
                   validatedClient.id !== undefined &&
                   validatedClient.validatorId !== undefined;
        }) as ValidatedClient[];

        if (activeClients.length === 0) {
            console.log("No validated clients to distribute requests to");
            return;
        }

        const shuffledEndpoints = endpoints.sort(() => Math.random() - 0.5);
        const urlsPerClient = Math.min(
            MAX_URLS_PER_VALIDATOR,
            Math.ceil(shuffledEndpoints.length / activeClients.length)
        );

        activeClients.forEach((client: ValidatedClient, index) => {
            const startIdx = index * urlsPerClient;
            const clientUrls = shuffledEndpoints.slice(startIdx, startIdx + urlsPerClient);
            
            if (clientUrls.length > 0) {
                const message: ValidationResponse = {
                    type: 'VALIDATION_REQUEST',
                    payload: {
                        urls: clientUrls,
                        id: client.id,
                        validatorId: client.validatorId
                    }
                };
                
                client.send(JSON.stringify(message));
            }
        });
   } catch (error) {
    console.error(error);
   }
}


const checkInvalidConnections = async () => {
    requestMappings.forEach((connection, key) => {
        if (connection.timestamp < Date.now() - 1000 * 15) {
            requestMappings.delete(key);
        }
    })
};

const verifySignature = async (address: string, signature: string, id: string) => {
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
    const urls = endpoints.map((endpoint: Monitor) => endpoint.url);
    console.log(urls);
    return urls;
};

setInterval(checkInvalidConnections,INVALID_CONNECTION_TIMEOUT);
setInterval(distributeRequests, DISTRIBUTE_INTERVAL);