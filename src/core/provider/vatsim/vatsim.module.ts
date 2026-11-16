import { Module } from '@nestjs/common';
import { VatsimClient, VatsimClientProvider } from './client/vatsim.client';

@Module({
  providers: [VatsimClientProvider],
  exports: [VatsimClient],
})
export class VatsimModule {}
