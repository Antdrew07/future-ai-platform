/**
 * Future AI Platform — Durable Task Queue
 *
 * Replaces the fragile in-memory agent loop with a BullMQ-backed job queue.
 * This ensures:
 *  1. Tasks survive server restarts (jobs are persisted in Redis)
 *  2. Tasks can be distributed across multiple worker processes
 *  3. Failed tasks are automatically retried with exponential backoff
 *  4. Task state is always recoverable from the database
 *
 * Architecture:
 *  - Producer: API routes enqueue jobs via `enqueueAgentTask()`
 *  - Worker:   `startAgentWorker()` processes jobs in the background
 *  - SSE:      Results are broadcast via the existing `activeStreams` map
 *              AND persisted to the `task_steps` table for reconnection
 *
 * Redis connection:
 *  - Uses REDIS_URL env var (defaults to localhost:6379 for dev)
 *  - Falls back to in-process simulation if Redis is unavailable
 */

import { Queue, Worker, Job, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { runAgentLoop, type AgentStep } from "./agentLoop";
import { updateTask, getTaskById } from "./db";

// ─── Redis Connection ─────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

let redisConnection: IORedis | null = null;
let queueAvailable = false;

function getRedisConnection(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisConnection.on("connect", () => {
      queueAvailable = true;
      console.log("[TaskQueue] Redis connected — durable queue active");
    });

    redisConnection.on("error", (err) => {
      queueAvailable = false;
      console.warn("[TaskQueue] Redis unavailable — falling back to in-process execution:", err.message);
    });
  }
  return redisConnection;
}

// ─── Queue Definition ─────────────────────────────────────────────────────────

export interface AgentTaskJobData {
  taskId: number;
  agentId: number;
  userId: number;
  userMessage: string;
  sessionId?: string;
  workspaceId?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
}

let agentQueue: Queue<AgentTaskJobData> | null = null;

function getQueue(): Queue<AgentTaskJobData> | null {
  if (!queueAvailable) return null;
  if (!agentQueue) {
    agentQueue = new Queue<AgentTaskJobData>("agent-tasks", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000, // Start with 2s, then 4s, 8s
        },
        removeOnComplete: { age: 86400 }, // Keep completed jobs for 24h
        removeOnFail: { age: 604800 },    // Keep failed jobs for 7 days
      },
    });
  }
  return agentQueue;
}

// ─── SSE Broadcast Registry ───────────────────────────────────────────────────
// Shared with agentStream.ts so the worker can push events to connected clients

const stepListeners = new Map<number, Array<(step: AgentStep) => void>>();
const completeListeners = new Map<number, Array<(result: { finalAnswer: string; creditsUsed: number; steps: AgentStep[] }) => void>>();
const errorListeners = new Map<number, Array<(error: string) => void>>();

export function onTaskStep(taskId: number, cb: (step: AgentStep) => void): () => void {
  const listeners = stepListeners.get(taskId) ?? [];
  listeners.push(cb);
  stepListeners.set(taskId, listeners);
  return () => {
    const updated = stepListeners.get(taskId)?.filter(l => l !== cb) ?? [];
    stepListeners.set(taskId, updated);
  };
}

export function onTaskComplete(
  taskId: number,
  cb: (result: { finalAnswer: string; creditsUsed: number; steps: AgentStep[] }) => void,
): () => void {
  const listeners = completeListeners.get(taskId) ?? [];
  listeners.push(cb);
  completeListeners.set(taskId, listeners);
  return () => {
    const updated = completeListeners.get(taskId)?.filter(l => l !== cb) ?? [];
    completeListeners.set(taskId, updated);
  };
}

export function onTaskError(taskId: number, cb: (error: string) => void): () => void {
  const listeners = errorListeners.get(taskId) ?? [];
  listeners.push(cb);
  errorListeners.set(taskId, listeners);
  return () => {
    const updated = errorListeners.get(taskId)?.filter(l => l !== cb) ?? [];
    errorListeners.set(taskId, updated);
  };
}

function broadcastStep(taskId: number, step: AgentStep) {
  for (const cb of stepListeners.get(taskId) ?? []) cb(step);
}

function broadcastComplete(taskId: number, result: { finalAnswer: string; creditsUsed: number; steps: AgentStep[] }) {
  for (const cb of completeListeners.get(taskId) ?? []) cb(result);
  // Clean up listeners after completion
  stepListeners.delete(taskId);
  completeListeners.delete(taskId);
  errorListeners.delete(taskId);
}

function broadcastError(taskId: number, error: string) {
  for (const cb of errorListeners.get(taskId) ?? []) cb(error);
  // Clean up listeners after error
  stepListeners.delete(taskId);
  completeListeners.delete(taskId);
  errorListeners.delete(taskId);
}

// ─── Task Execution ───────────────────────────────────────────────────────────

async function executeAgentTask(data: AgentTaskJobData): Promise<void> {
  const { taskId, agentId, userId, userMessage, sessionId, conversationHistory } = data;

  try {
    await runAgentLoop({
      taskId,
      agentId,
      userId,
      userMessage,
      sessionId,
      conversationHistory,
      onStep: (step) => broadcastStep(taskId, step),
      onComplete: (result) => broadcastComplete(taskId, result),
      onError: (error) => broadcastError(taskId, error),
    });
  } catch (err) {
    const errorMsg = String(err);
    await updateTask(taskId, {
      status: "failed",
      errorMessage: errorMsg,
      completedAt: new Date(),
    });
    broadcastError(taskId, errorMsg);
    throw err; // Re-throw so BullMQ can handle retries
  }
}

// ─── Producer: Enqueue a Task ─────────────────────────────────────────────────

/**
 * Enqueue an agent task for durable execution.
 * Falls back to direct in-process execution if Redis is unavailable.
 */
export async function enqueueAgentTask(data: AgentTaskJobData): Promise<void> {
  const queue = getQueue();

  if (queue) {
    // Durable: persist to Redis queue, worker picks it up
    await queue.add("run-agent", data, {
      jobId: `task-${data.taskId}`, // Idempotent: prevents duplicate jobs
    });
    console.log(`[TaskQueue] Enqueued task ${data.taskId} to Redis queue`);
  } else {
    // Fallback: run in-process (dev mode or Redis unavailable)
    console.log(`[TaskQueue] Redis unavailable — running task ${data.taskId} in-process`);
    void executeAgentTask(data);
  }
}

// ─── Worker: Process Queued Tasks ─────────────────────────────────────────────

let worker: Worker<AgentTaskJobData> | null = null;

/**
 * Start the BullMQ worker that processes agent tasks.
 * Call this once at server startup.
 */
export function startAgentWorker(): void {
  try {
    const connection = getRedisConnection();

    // Attempt to connect — if it fails, worker won't start
    connection.connect().then(() => {
      worker = new Worker<AgentTaskJobData>(
        "agent-tasks",
        async (job: Job<AgentTaskJobData>) => {
          console.log(`[AgentWorker] Processing job ${job.id} — task ${job.data.taskId}`);
          await executeAgentTask(job.data);
        },
        {
          connection,
          concurrency: 5, // Process up to 5 tasks simultaneously
          limiter: {
            max: 10,
            duration: 1000, // Max 10 tasks/second across all workers
          },
        },
      );

      worker.on("completed", (job) => {
        console.log(`[AgentWorker] Job ${job.id} completed (task ${job.data.taskId})`);
      });

      worker.on("failed", (job, err) => {
        console.error(`[AgentWorker] Job ${job?.id} failed (task ${job?.data.taskId}):`, err.message);
        if (job?.data.taskId) {
          void updateTask(job.data.taskId, {
            status: "failed",
            errorMessage: err.message,
            completedAt: new Date(),
          });
        }
      });

      worker.on("stalled", (jobId) => {
        console.warn(`[AgentWorker] Job ${jobId} stalled — will be retried`);
      });

      console.log("[AgentWorker] BullMQ worker started — listening for tasks");
    }).catch((err: Error) => {
      console.warn("[AgentWorker] Could not connect to Redis — worker not started:", err.message);
    });
  } catch (err) {
    console.warn("[AgentWorker] Failed to initialize worker:", String(err));
  }
}

/**
 * Gracefully shut down the worker (call on process exit).
 */
export async function stopAgentWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    console.log("[AgentWorker] Worker stopped");
  }
  if (redisConnection) {
    await redisConnection.quit();
    console.log("[TaskQueue] Redis connection closed");
  }
}

/**
 * Get the current queue depth (for admin monitoring).
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  isAvailable: boolean;
}> {
  const queue = getQueue();
  if (!queue) {
    return { waiting: 0, active: 0, completed: 0, failed: 0, isAvailable: false };
  }

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed, isAvailable: true };
}
