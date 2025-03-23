import getPrismaInstance from "@repo/database";
import { Router } from "express";

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
    //send solana to this address from the balance
    await prisma.validator.update({
        where: { address },
        data: { balance: 0 },
    });
    res.send(true);
});

export default router;