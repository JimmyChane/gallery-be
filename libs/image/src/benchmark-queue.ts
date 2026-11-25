import { Logger } from '@nestjs/common';

import { BatchQueue } from './batch-queue';

/**
 * Nearest-Rank percentile: always returns an actual value from the sorted array.
 */
export function percentileNearestRank(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const clampedP = Math.min(100, Math.max(0, p));
  const index = Math.ceil((clampedP / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, index))] ?? 0;
}

/**
 * Linear Interpolation percentile: blends between the two nearest values.
 */
export function percentileLinear(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0] ?? 0;

  const clampedP = Math.min(100, Math.max(0, p));
  const pos = (clampedP / 100) * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  const weight = pos - lower;

  const lowerVal = sorted[lower] ?? 0;
  const upperVal = sorted[upper] ?? 0;
  return lowerVal + (upperVal - lowerVal) * weight;
}

export interface BenchmarkQueueOptions {
  logger: Logger;
  label: string;
  /** @default 100 */
  batchSize?: number;
  /** @default 30_000 */
  flushIntervalMs?: number;
  /**
   * Output format for flushed benchmark logs.
   *
   * - `'line'`:
   * ```text
   * [transformer] (x100) | p50: 12.30ms | p90: 28.45ms | p99: 64.10ms | max: 89.20ms
   * ```
   * - `'table'`:
   * ```text
   * [transformer] (x100)
   * ┌────────┬──────────┐
   * │ Metric │ Duration │
   * ├────────┼──────────┤
   * │ p50    │  12.30ms │
   * │ p90    │  28.45ms │
   * │ p99    │  64.10ms │
   * │ max    │  89.20ms │
   * └────────┴──────────┘
   * ```
   *
   * @default 'line'
   */
  format?: 'line' | 'table';
}

export class BenchmarkQueue {
  private readonly queue: BatchQueue<number>;

  constructor(options: BenchmarkQueueOptions) {
    const format = options.format ?? 'line';

    this.queue = new BatchQueue<number>({
      batchSize: options.batchSize ?? 100,
      flushIntervalMs: options.flushIntervalMs ?? 30_000,
      onFlush: (durations) => {
        const sorted = [...durations].sort((a, b) => a - b);
        const p50 = `${percentileLinear(sorted, 50).toFixed(2)}ms`;
        const p90 = `${percentileLinear(sorted, 90).toFixed(2)}ms`;
        const p99 = `${percentileLinear(sorted, 99).toFixed(2)}ms`;
        const max = `${(sorted[sorted.length - 1] ?? 0).toFixed(2)}ms`;

        if (format === 'table') {
          const w = Math.max(8, p50.length, p90.length, p99.length, max.length);
          const border = '─'.repeat(w + 2);
          const row = (name: string, val: string) =>
            `│ ${name.padEnd(6)} │ ${val.padStart(w)} │`;

          options.logger.log(
            [
              `[${options.label}] (x${sorted.length})`,
              `┌────────┬${border}┐`,
              `│ Metric │ ${'Duration'.padStart(w)} │`,
              `├────────┼${border}┤`,
              row('p50', p50),
              row('p90', p90),
              row('p99', p99),
              row('max', max),
              `└────────┴${border}┘`,
            ].join('\n'),
          );
          return;
        }

        options.logger.log(
          `[${options.label}] (x${sorted.length}) | p50: ${p50} | p90: ${p90} | p99: ${p99} | max: ${max}`,
        );
      },
    });
  }

  async run<T>(fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.queue.push(performance.now() - start);
    }
  }

  flush(): void {
    this.queue.flush();
  }
}
