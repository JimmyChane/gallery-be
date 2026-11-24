import { MaybePromise } from '@chanzor/utils';
import { Logger } from '@nestjs/common';

export async function benchmark<T>(
  logger: Logger,
  name: string,
  run: () => MaybePromise<T>,
) {
  const now = performance.now();

  try {
    return await run();
  } catch (error) {
    const elapsed = performance.now() - now;
    logger.debug(`[${name}] took: ${elapsed.toFixed(2)}ms`);
    throw error;
  } finally {
    const elapsed = performance.now() - now;
    logger.debug(`[${name}] took: ${elapsed.toFixed(2)}ms`);
  }
}
