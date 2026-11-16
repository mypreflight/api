import { Module } from '@nestjs/common';
import {
  FaaDatisClient,
  FaaDatisClientProvider,
} from './client/faa-datis.client';

@Module({
  providers: [FaaDatisClientProvider],
  exports: [FaaDatisClient],
})
export class FaaDatisModule {}
