# Checkpointing (Resumable Jobs)

BatchJS supports checkpointing for long-running jobs. When a job fails or is interrupted, it can resume from where it left off instead of restarting from the beginning. This saves time and resources for batches that run for hours or days.

## How It Works

1. **Checkpoint store** – A persistence layer that saves job state (file-based by default).
2. **Step tracking** – Each step's status is tracked (`CREATED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
3. **Resume logic** – When a job starts, it checks for an existing checkpoint and skips already completed steps.

## Enabling Checkpointing

Pass a `checkpointStore` to the job constructor:

```typescript
import { Job, FileCheckpointStore } from 'batchjs';

const store = new FileCheckpointStore('./.batchjs/checkpoints');

class MyJob extends Job {
  protected _steps() {
    return [/* ... */];
  }
}

const job = new MyJob('my-job', {}, { checkpointStore: store });
job.run();
```

## The CheckpointStore Interface

You can implement custom storage backends by implementing the `CheckpointStore` interface:

```typescript
interface CheckpointStore {
  /**
   * Load the checkpoint for a given job ID.
   * @returns The checkpoint state, or null if none exists.
   */
  load(jobId: string): Promise<JobCheckpoint | null>;

  /**
   * Save the checkpoint state.
   */
  save(jobId: string, checkpoint: JobCheckpoint): Promise<void>;

  /**
   * Delete a checkpoint (optional).
   */
  delete?(jobId: string): Promise<void>;
}

interface JobCheckpoint {
  jobName: string;
  params: Record<string, unknown>;
  stepStatus: Record<string, RunnableStatus>;
  metadata?: Record<string, unknown>;
  updatedAt: Date;
}
```

## FileCheckpointStore

The default file-based store saves checkpoints as JSON files:

```typescript
import { FileCheckpointStore } from 'batchjs';

// Default directory: './.batchjs/checkpoints'
const store = new FileCheckpointStore();

// Custom directory
const store = new FileCheckpointStore('./my-checkpoints');
```

Each checkpoint is stored as a separate JSON file named `{jobId}.json`.

## Resume Behavior

When a job with checkpointing enabled starts:

| Scenario                  | Behavior                                                      |
|---------------------------|---------------------------------------------------------------|
| **All steps completed**   | Job immediately transitions to `COMPLETED`                    |
| **Some steps completed**  | Skips completed steps, runs from the first uncompleted step   |
| **No checkpoint exists**  | Runs all steps normally                                       |
| **Checkpoint load fails** | Job transitions to `FAILED` with an error                     |

## Parallel Steps

In parallel groups, only failed or uncompleted steps are rerun. Completed parallel steps are skipped:

```typescript
protected _steps() {
  return [
    [stepA, stepB, stepC], // Runs in parallel
  ];
}

// If stepA completes but stepB fails and stepC cancels, on resume:
// - stepA is skipped (COMPLETED)
// - stepB is rerun (FAILED → rerun)
// - stepC is rerun (CANCELED → rerun)
```

## Checkpoint Persistence

Checkpoints are saved automatically:

| Event             | Status Saved  |
|-------------------|---------------|
| Step starts       | `RUNNING`     |
| Step completes    | `COMPLETED`   |
| Step fails        | `FAILED`      |
| Step is cancelled | `CANCELLED`   |

## Custom CheckpointStore

You can implement custom checkpointStore by implementing `CheckpointStore`. For example a custom redis store can be implemented :

```typescript
import { CheckpointStore, JobCheckpoint } from 'batchjs';
import Redis from 'ioredis';

class RedisCheckpointStore implements CheckpointStore {
  private readonly redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async load(jobId: string): Promise<JobCheckpoint | null> {
    const data = await this.redis.get(`checkpoint:${jobId}`);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      updatedAt: new Date(parsed.updatedAt),
    };
  }

  async save(jobId: string, checkpoint: JobCheckpoint): Promise<void> {
    await this.redis.set(
      `checkpoint:${jobId}`,
      JSON.stringify(checkpoint),
      'EX',
      86400 // 24 hours TTL
    );
  }

  async delete(jobId: string): Promise<void> {
    await this.redis.del(`checkpoint:${jobId}`);
  }
}
```

## Important Notes

| Note                          | Description                                                                                                                   |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| **Job identification**        | Jobs are identified by `jobId = UUID v5(name + params)`. The same job with the same parameters shares checkpoints.            |
| **Concurrent execution**      | If the same job runs concurrently, checkpoint conflicts may occur. It's the user's responsibility to avoid this.              |
| **Params serialization**      | Job parameters are serialized using `JSON.stringify()` for ID generation. Ensure your parameters are serializable.            |
| **Non-serializable params**   | If your params contain non-serializable data, consider using a custom `CheckpointStore` or overriding the ID generation.      |
