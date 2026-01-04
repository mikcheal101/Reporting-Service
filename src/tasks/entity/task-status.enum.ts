export enum TaskStatus {
  SCHEDULED = 'SCHEDULED', // Task is created and waiting for its run time
  QUEUED = 'QUEUED', // Ready to run, sitting in queue
  RUNNING = 'RUNNING', // Currently executing
  COMPLETED = 'COMPLETED', // Finished successfully
  FAILED = 'FAILED', // Tried and errored out
  RETRYING = 'RETRYING', // Failed but will try again
  PAUSED = 'PAUSED', // Temporarily stopped — can resume later
  CANCELLED = 'CANCELLED', // Will never run again
  EXPIRED = 'EXPIRED', // Missed schedule / no longer valid
}
