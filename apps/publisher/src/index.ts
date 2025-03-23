import WebSocket from "ws";
import getPrismaInstance from "@repo/database";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";
import { Connection, Monitor, ResponsePayload, ValidationResponse } from "./types/types";
import { DISTRIBUTE_INTERVAL, INVALID_CONNECTION_TIMEOUT, MAX_URLS_PER_VALIDATOR, SOLANA_REWARD_AMOUNT } from "./types/consts";

interface ValidatedClient extends WebSocket {
    id: string;
    validatorId: string;
}

const prisma = getPrismaInstance();

const wss = new WebSocket.Server({ port: 8080 });


const requestMappings = new Map<string, Connection>();

wss.on("connection", async (ws: ValidatedClient) => {
    ws.on("message", async (message) => {
        try {
            const { type, payload } = JSON.parse(message.toString());
            switch (type) {
                case 'VALIDATION_REQUEST':
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
                                // this should be pushed to a queue, and a worker should handle it.
                                try {
                                    console.log(responsePayload, "responsePayload", responsePayload.result);
                                    const monitors = await prisma.monitor.findMany({
                                        where: {
                                            url: {
                                                in: responsePayload.result.map(r => r.url)
                                            }
                                        }
                                    });

                                    console.log(monitors, "monitors");

                                    const resultsToCreate = monitors.map((monitor: Monitor) => {
                                        const urlResult = responsePayload.result.find(r => r.url === monitor.url)!;
                                        return {
                                            monitorId: monitor.id,
                                            validatorId: responsePayload.validatorId,
                                            responseTime: urlResult.result.responseTime,
                                            result: urlResult.result.result,
                                            status: urlResult.result.status,
                                        }
                                    });
                                    console.log(resultsToCreate, "resultsToCreate");

                                    await prisma.$transaction([
                                        prisma.monitorResults.createMany({
                                            data: resultsToCreate
                                        })
                                    ]);
                                    console.log("results created");

                                    await prisma.validator.update({
                                        where: {
                                            id: responsePayload.validatorId
                                        },
                                        data: { balance: validator!.balance + SOLANA_REWARD_AMOUNT } 

                                    });
                                    console.log("validator updated");
                                } catch (error) {
                                    console.error('Error processing response:', error);
                                }
                            }, timestamp: Date.now()
                        });
                    }
                    break;
                case 'UPDATE':
                    console.log("UPDATE", payload);
                    if (requestMappings.has(payload.id)) {
                        requestMappings.get(payload.id)!.callback(payload);
                        requestMappings.set(payload.id, {
                            ...requestMappings.get(payload.id)!,
                            timestamp: Date.now()
                        });
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
        console.log(requestMappings.keys(), "requestMappings");
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

            console.log(client.id, "clientUrls", client.validatorId);
            
            if (clientUrls.length > 0) {
                const message: ValidationResponse = {
                    type: 'VALIDATION_RESPONSE',
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
            console.log("Connection Invalidated", key);
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