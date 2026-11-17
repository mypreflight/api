import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { fetchWithRetry } from '../../http/fetch-with-retry';
import {
  OpenAiResponsePayload,
  OpenAiStructuredRequest,
} from '../type/openai.types';

const FETCH_OPTIONS = { timeoutMs: 15000, retries: 0 };

@Injectable()
export class OpenAiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  async createStructuredResponse<T>(
    request: OpenAiStructuredRequest,
  ): Promise<T> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/v1/responses`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model,
          reasoning: { effort: request.reasoningEffort },
          instructions: request.instructions,
          input: request.input,
          text: {
            format: {
              type: 'json_schema',
              name: request.schemaName,
              schema: request.schema,
              strict: true,
            },
          },
          max_output_tokens: request.maxOutputTokens,
          store: false,
        }),
      },
      FETCH_OPTIONS,
    );

    if (!response.ok) {
      throw new Error(`OpenAI answered ${response.status}`);
    }

    const payload = (await response.json()) as OpenAiResponsePayload;

    if (payload.status !== 'completed') {
      throw new Error(
        `OpenAI left the response ${payload.status ?? 'without a status'}`,
      );
    }

    const content = (payload.output ?? [])
      .filter((item) => item.type === 'message')
      .flatMap((item) => item.content ?? []);
    const refusal = content.find((item) => item.type === 'refusal');

    if (refusal) {
      throw new Error(`OpenAI refused: ${refusal.refusal ?? ''}`);
    }

    const text = content.find((item) => item.type === 'output_text')?.text;

    if (!text) {
      throw new Error('OpenAI returned no text');
    }

    return JSON.parse(text) as T;
  }
}

export const OpenAiClientProvider = {
  provide: OpenAiClient,
  useFactory: (config: ConfigService) =>
    new OpenAiClient(
      config.getOrThrow<string>('OPENAI_API_HOST'),
      config.getOrThrow<string>('OPENAI_API_KEY'),
    ),
  inject: [ConfigService],
};
