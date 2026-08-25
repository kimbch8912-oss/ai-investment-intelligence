import type { AgentError, AgentRunEnvelope } from '../types.ts';
import { CIO_CONFIG } from './config.ts';
import { DeterministicCioFixtureClient } from './fixture-client.ts';
import { buildCioInput } from './input-builder.ts';
import type { CioAgentOutput, CioFixtureClient, CioInput } from './types.ts';
import { validateCioOutput } from './validator.ts';

const now = () => new Date().toISOString();
const envelope = (startedAt: string, input: CioInput | null, status: 'UNKNOWN' | 'FAILED', error: AgentError): AgentRunEnvelope<CioAgentOutput> => ({ runId: `cio-${startedAt}`, agent: 'cio', agentVersion: CIO_CONFIG.agentVersion, promptVersion: CIO_CONFIG.promptVersion, status, inputAsOfTime: input?.asOfTime ?? null, startedAt, finishedAt: now(), output: null, errors: [error] });

export function runCioAgent(input: CioInput | null, client: CioFixtureClient = new DeterministicCioFixtureClient()): AgentRunEnvelope<CioAgentOutput> {
  const startedAt = now();
  if (!input) return envelope(startedAt, input, 'UNKNOWN', { code: 'AGENT_INPUT_INVALID', message: 'CIO input is required.', retryable: false });
  const built = buildCioInput(input);
  if ('error' in built) return envelope(startedAt, input, 'UNKNOWN', built.error);
  try { const output = client.generate(built.context); const error = validateCioOutput(output, built.context); return error ? envelope(startedAt, input, 'FAILED', error) : { runId: `cio-${startedAt}`, agent: 'cio', agentVersion: CIO_CONFIG.agentVersion, promptVersion: CIO_CONFIG.promptVersion, status: output.status === 'UNKNOWN' ? 'UNKNOWN' : 'COMPLETED', inputAsOfTime: input.asOfTime, startedAt, finishedAt: now(), output, errors: [] }; }
  catch { return envelope(startedAt, input, 'FAILED', { code: 'AGENT_OUTPUT_INVALID', message: 'Deterministic CIO fixture client failed.', retryable: false }); }
}
