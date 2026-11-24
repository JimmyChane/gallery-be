import { RedisService } from '@app/redis/redis.service';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redlock, { ExecutionError, Lock } from 'redlock';

@Injectable()
export class RedlockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedlockService.name);
  private redlock!: Redlock;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    const client = await this.redisService.getClient();

    this.redlock = new Redlock([client], {
      driftFactor: 0.01, // time in ms
      retryCount: 10,
      retryDelay: 200, // time in ms
      retryJitter: 200, // time in ms
      automaticExtensionThreshold: 500, // time in ms
    });

    this.redlock.on('error', (error: Error) => {
      this.logger.error('Error', error);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redlock) {
      try {
        this.logger.log('Destroying...');
        // This stops all automatic extensions and internal timers
        await this.redlock.quit();
        this.logger.log('Destroyed');
      } catch (error) {
        this.logger.error('Error during destruction', error);
      }
    }
  }

  async acquire(resource: string, ttl: number): Promise<Lock> {
    return await this.redlock.acquire([resource], ttl);
  }

  async using<T>(
    resource: string,
    ttl: number,
    handler: () => Promise<T>,
  ): Promise<T | 'conflict'> {
    return await this.redlock
      .using([resource], ttl, () => handler())
      .catch((e: Error) => {
        if (e instanceof ExecutionError) return 'conflict';
        throw e;
      });
  }
}
