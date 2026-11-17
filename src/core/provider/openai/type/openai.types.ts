export type OpenAiStructuredRequest = {
  model: string;
  reasoningEffort: string;
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens: number;
};

export type OpenAiResponseContent = {
  type: string;
  text?: string;
  refusal?: string;
};

export type OpenAiResponseOutput = {
  type: string;
  content?: OpenAiResponseContent[];
};

export type OpenAiResponsePayload = {
  status?: string;
  output?: OpenAiResponseOutput[];
};
