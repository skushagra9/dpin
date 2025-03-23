import { Router } from "express";
import getPrismaInstance from "@repo/database";

const router: Router = Router();
const prisma = getPrismaInstance();

router.post("/create", async (req, res) => {
    const { url, stripeId } = req.body;
    const monitor = await prisma.monitor.create({
        data: { url, user: { connect: { stripeId } } },
    });
    res.send(monitor);
});

router.get("/endpoints/:stripeId", async (req, res) => {
    const { stripeId } = req.params;
    const endpoints = await prisma.user.findMany({
        where: {
            stripeId,
        },
        include: {
            monitors: {
                include: {
                    results: {
                        where: {
                            createdAt: {
                                gte: new Date(Date.now() - 1000 * 60 * 60 * 0.5),
                            },
                        },
                    },
                },
            },
        },
    });
    res.send(endpoints);
});

export default router;