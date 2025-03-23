import express from "express";
import cors from "cors";
import validatorRoutes from "./routes/validatorRoutes";
import userRoutes from "./routes/userRoutes";
import webhookRoutes from "./routes/webhookRoutes";

const app = express();
app.use(cors());
app.use(express.json());


app.get("/health", (req, res) => {
    res.send("OK");
});

app.use("/user", userRoutes);
app.use("/validator", validatorRoutes);
app.use("/webhook", webhookRoutes);


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

