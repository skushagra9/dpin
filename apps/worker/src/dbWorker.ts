import { failedTransactionsQueue } from "@repo/redis";
import { confirmTx, updateDb } from "./service";
import { Worker } from "bullmq";


const dbWorker = new Worker("db", async (job) => {
    const { account, txHash } = job.data;
    const txResult = await confirmTx(account, txHash);

    if (txResult) {
        await updateDb(account);
    } else {
        throw new Error("Solana transaction failed");
    }
});

dbWorker.on("completed", (jobId, result) => {
    console.log(`Job ${jobId} completed with result ${result}`);
});

dbWorker.on("failed", async (job, error) => {
    if (job && job.attemptsMade >= job.opts.attempts!) {
        console.error(`Final retry failed for job ${job.id}`, {
            account: job.data.account,
            error: error.message,
            attempts: job.attemptsMade
        });

        await failedTransactionsQueue.add("failedTransactions", {
            account: job.data.account,
            error: error.message,
            failedAt: new Date(),
            attempts: job.attemptsMade
        });
    }
}); 
export default dbWorker;
