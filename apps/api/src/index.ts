import express from "express";
import cors from "cors";
import DbConnection from "@repo/database";

const prisma = DbConnection.getInstance();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.send("OK");
});

app.post("/create", async (req, res) => {
    const { url, stripeId } = req.body;
    const monitor = await prisma.monitor.create({
        data: { url, user: { connect: { stripeId } } },
    });
    res.send(monitor);
});

app.get("/endpoints/:stripeId", async (req, res) => {
    const { stripeId } = req.params;
    const endpoints = await prisma.user.findMany({
        where: {
            stripeId,
        },
        include: {
            monitors: true,
        },
    });
    res.send(endpoints);
});

app.get("/endpoints/status/:stripeId", async (req, res) => {
    const { stripeId } = req.params;
    const results = await prisma.monitorResults.findMany({
        where: {
            monitor: {
                user: {
                    stripeId,
                },
            },
            createdAt: {
                gte: new Date(Date.now() - 1000 * 60 * 60 * 0.5),
            },
        },
    });
    res.send(results);
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

