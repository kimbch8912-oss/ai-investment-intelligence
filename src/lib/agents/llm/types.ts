export interface StructuredLlmClient { generateStructured<T>(input: { systemPrompt: string; inputPrompt: string; context: unknown }): Promise<T>; }
