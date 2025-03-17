import WebSocket from "ws";

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
    ws.on("message", (message) => {
        console.log(message);
    });
    ws.on("close", () => {
        console.log("Client disconnected");
    });
    ws.on("error", (error) => {
        console.error(error);
    });
    ws.send("Hello from publisher");
}); 

wss.on("error", (error) => {
    console.error(error);
});

wss.on("listening", () => {
    console.log("Publisher is running on port 8080");
});