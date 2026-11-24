import { RedisModule } from '@app/redis/redis.module';
import { Module } from '@nestjs/common';
import { RedlockService } from './redlock.service';

@Module({
  imports: [RedisModule],
  providers: [RedlockService],
  exports: [RedlockService],
})
export class RedlockModule {}
