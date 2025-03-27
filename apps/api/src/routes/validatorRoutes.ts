import getPrismaInstance from "@repo/database";
import { Router } from "express";
import { paymentsQueue } from "@repo/redis";

const router: Router = Router();
const prisma = getPrismaInstance();

// no validation required
router.get("/balance", async (req, res) => {
    const { address } = req.body;
    const balance = await prisma.validator.findUnique({
        where: { address },
    });
    res.send(balance?.balance);
});

router.post("/withdraw", async (req, res) => {
    const { address } = req.body;

    // send this in a redis queue
    //solana transaction
    const validator = await prisma.validator.findUnique({
        where: { address },
    });
    if (!validator) {
        res.status(400).send("Validator not found");
        return;
    }

    await paymentsQueue.add("withdraw", { address: validator.address, amount: validator.balance });
    res.send(true);
});

export default router;