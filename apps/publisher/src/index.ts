import WebSocket from "ws";
import getPrismaInstance from "@repo/database";

const prisma = getPrismaInstance();

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", async(ws) => {
    // const endpoints = await getEndpoints();
    // ws.send(JSON.stringify(endpoints));
    ws.on("message", (message) => {
        console.log(message);
        // distributeEndpoints();
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

const getEndpoints = async () => {
    const endpoints = await prisma.monitor.findMany({
        where: {
            picked: false
        },
    });

    console.log(endpoints);
    return endpoints.map((endpoint) => endpoint.url);
};