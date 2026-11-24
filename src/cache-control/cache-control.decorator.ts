import { CustomDecorator, SetMetadata } from '@nestjs/common';
import {
  CACHE_CONTROL_METADATA_KEY,
  CacheControlOption,
} from './cache-control.interceptor';

export function CacheControl(
  options: CacheControlOption,
): CustomDecorator<string> {
  return SetMetadata(CACHE_CONTROL_METADATA_KEY, options);
}
