import { Module } from '@nestjs/common';
import { OpenAiClient, OpenAiClientProvider } from './client/openai.client';

@Module({
  providers: [OpenAiClientProvider],
  exports: [OpenAiClient],
})
export class OpenAiModule {}
