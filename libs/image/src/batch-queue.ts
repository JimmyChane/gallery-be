export interface BatchQueueOptions<T> {
  /** Maximum number of items to buffer before automatically flushing. */
  batchSize: number;

  /**
   * Automatically flush after this many milliseconds even if the queue has not reached `batchSize`.
   * @default undefined
   */
  flushIntervalMs?: number;

  /** Callback invoked with the buffered items (in FIFO order) when the queue flushes. */
  onFlush: (items: T[]) => void;
}

export class BatchQueue<T> {
  private queue: T[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;

  private readonly batchSize: number;
  private readonly flushIntervalMs?: number;
  private readonly onFlush: (items: T[]) => void;

  constructor(options: BatchQueueOptions<T>) {
    this.batchSize = options.batchSize;
    this.flushIntervalMs = options.flushIntervalMs;
    this.onFlush = options.onFlush;
  }

  push(item: T): void {
    this.queue.push(item);

    if (this.queue.length >= this.batchSize) {
      this.flush();
      return;
    }

    if (this.flushIntervalMs !== undefined && !this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  flush(): void {
    this.clearTimer();
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.queue.length);
    this.onFlush(batch);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
