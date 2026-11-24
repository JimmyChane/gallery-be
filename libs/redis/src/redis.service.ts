import { waitMs } from '@chanzor/utils';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private initPromise!: Promise<void>;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      console.log('Manually initializing Redis connection...');

      this.logger.log('Connecting...');
      const clients = await this.initRedis({ host: 'redis', port: 6379 });
      this.client = clients[0]!;
      this.logger.log('Connected');
    })();

    return this.initPromise;
  }

  async onModuleInit(): Promise<void> {
    await this.init();
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting...');
    await this.destroyRedis(this.client);
    this.logger.log('Disconnected');
  }

  private async initRedis(
    ...nodes: { host: string; port: number }[]
  ): Promise<Redis[]> {
    const clientPromises = nodes.map((node) => {
      const redis = new Redis({
        host: node.host,
        port: node.port,
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });

      return new Promise<Redis>(async (resolve, reject) => {
        redis.once('ready', () => {
          this.logger.log(
            `Redis connected and ready on ${node.host}:${node.port}`,
          );
          resolve(redis);
        });

        redis.on('error', (err) => {
          this.logger.error(err);
        });

        await waitMs(15_000);
        if (redis.status !== 'ready') {
          reject(
            new Error(
              `Redis connection timed out for ${node.host}:${node.port}`,
            ),
          );
        }
      });
    });
    return await Promise.all(clientPromises);
  }

  private async destroyRedis(...clients: Redis[]) {
    const clientPromises = clients.map((client) => {
      return new Promise<Redis>(async (r) => {
        const onClose = () => {
          client.off('close', onClose);
          r(client);
        };
        client.on('close', onClose);

        await client.quit();
      });
    });
    await Promise.all(clientPromises);
  }

  async getClient(): Promise<Redis> {
    if (!this.initPromise) await this.init();

    let attempts = 0;
    while (!this.client) {
      if (attempts > 10)
        throw new Error('Redis instance was never initialized');
      await waitMs(1_000);
      attempts++;
    }

    if (this.client.status !== 'ready') {
      await new Promise<void>((resolve, reject) => {
        if (this.client.status === 'ready') return resolve();

        const onReady = () => {
          this.client.off('error', onError);
          resolve();
        };

        const onError = (error: Error) => {
          this.client.off('ready', onReady);
          reject(error);
        };

        this.client.once('ready', onReady);
        this.client.once('error', onError);

        // Safety timeout so the app doesn't stay in "starting" state forever
        setTimeout(() => {
          if (this.client.status !== 'ready') {
            this.client.off('ready', onReady);
            this.client.off('error', onError);
            return reject(new Error('Redis connection timeout'));
          }
        }, 10000);
      });
    }

    return this.client;
  }
}
