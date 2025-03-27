import { dbQueue, failedTransactionsQueue, lockAccount, unlockAccount } from "@repo/redis";  
import { processSolanaTransaction } from "./service";
import { Worker } from "bullmq";

const solanaWorker = new Worker("payments", async (job) => {
    const { account, balance } = job.data;

    if (await lockAccount(account)) {
        console.log(`Account ${account} is already being processed`);
        return;   
     }
    try {
        const txResult = await processSolanaTransaction(account, balance);

    if (txResult.success) {
        await dbQueue.add("db", { account, txHash: txResult.txHash });
      } else {
        throw new Error("Solana transaction failed");
      }
    } finally {
        await unlockAccount(account);
    }
});

solanaWorker.on("completed", (jobId, result) => {
    console.log(`Job ${jobId} completed with result ${result}`);
});

solanaWorker.on("failed", async (job, error) => {
    if (job && job.attemptsMade >= job.opts.attempts!) {
        console.error(`Final retry failed for job ${job.id}`, {
            account: job.data.account,
            error: error.message,
            attempts: job.attemptsMade
        });

        await failedTransactionsQueue.add("failedTransactions", {
            account: job.data.account,
            balance: job.data.balance,
            error: error.message,
            failedAt: new Date(),
            attempts: job.attemptsMade
        });

    }
});

export default solanaWorker;
