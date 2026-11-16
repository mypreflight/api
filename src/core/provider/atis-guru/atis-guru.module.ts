import { Module } from '@nestjs/common';
import {
  AtisGuruClient,
  AtisGuruClientProvider,
} from './client/atis-guru.client';

@Module({
  providers: [AtisGuruClientProvider],
  exports: [AtisGuruClient],
})
export class AtisGuruModule {}
