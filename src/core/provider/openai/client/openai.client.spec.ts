import { OpenAiClient } from './openai.client';
import { OpenAiStructuredRequest } from '../type/openai.types';

const BASE_URL = 'https://openai.example';
const API_KEY = 'sk-test';

const request: OpenAiStructuredRequest = {
  model: 'gpt-6-luna',
  reasoningEffort: 'none',
  instructions: 'Read the runways.',
  input: 'RWY IN USE 27',
  schemaName: 'runways',
  schema: { type: 'object' },
  maxOutputTokens: 200,
};

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function answered(content: unknown[], status = 'completed') {
  return jsonResponse(200, {
    status,
    output: [
      { type: 'reasoning', summary: [] },
      { type: 'message', content },
    ],
  });
}

describe('OpenAiClient', () => {
  let fetchMock: jest.SpyInstance;

  const client = new OpenAiClient(BASE_URL, API_KEY);

  afterEach(() => {
    fetchMock?.mockRestore();
  });

  it('asks for a strict JSON schema answer and parses it', async () => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        answered([
          { type: 'output_text', text: '{"arrival":["27"],"departure":[]}' },
        ]),
      );

    await expect(client.createStructuredResponse(request)).resolves.toEqual({
      arrival: ['27'],
      departure: [],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/v1/responses`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${API_KEY}`);
    expect(JSON.parse(init.body)).toEqual({
      model: 'gpt-6-luna',
      reasoning: { effort: 'none' },
      instructions: 'Read the runways.',
      input: 'RWY IN USE 27',
      text: {
        format: {
          type: 'json_schema',
          name: 'runways',
          schema: { type: 'object' },
          strict: true,
        },
      },
      max_output_tokens: 200,
      store: false,
    });
  });

  it('fails when OpenAI answers with an error status', async () => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(jsonResponse(429, { error: {} }));

    await expect(client.createStructuredResponse(request)).rejects.toThrow(
      'OpenAI answered 429',
    );
  });

  it('fails when the response is incomplete', async () => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        answered([{ type: 'output_text', text: '{"arrival":[' }], 'incomplete'),
      );

    await expect(client.createStructuredResponse(request)).rejects.toThrow(
      'OpenAI left the response incomplete',
    );
  });

  it('fails when the model refuses', async () => {
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(answered([{ type: 'refusal', refusal: 'No.' }]));

    await expect(client.createStructuredResponse(request)).rejects.toThrow(
      'OpenAI refused: No.',
    );
  });
});
