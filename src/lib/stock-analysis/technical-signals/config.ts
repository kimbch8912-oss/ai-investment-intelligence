export const technicalSignalConfig = {
  version: 'm5c-v1',
  momentum: { positiveReturn: 0.01, negativeReturn: -0.01 },
  rsi: { overbought: 70, strong: 60, weak: 40, oversold: 30 },
  volatilityDaily: { low: 0.01, normal: 0.02, elevated: 0.03 },
  drawdown: { low: -0.05, normal: -0.10, elevated: -0.20 },
  volume: { minimumChange: 0, },
  levels: { proximityRatio: 0.02 },
} as const;
