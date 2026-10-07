import type { MockQuoteFile } from '../../src/data/schemas.ts';

/**
 * ILLUSTRATIVE stock quote for the preview. Deterministic synthetic data — NOT market data, not derived from any feed.
 * Real quotes for 2020.HK may only be displayed via an HKEX-licensed vendor (>=15-min delay, attribution, disclaimer).
 */
export function buildMockQuote(asOfDate = '2026-10-07'): MockQuoteFile {
  let seed = 20202020;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const days: string[] = [];
  const d = new Date(`${asOfDate}T00:00:00Z`);
  while (days.length < 250) {
    d.setUTCDate(d.getUTCDate() - 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) days.unshift(d.toISOString().slice(0, 10));
  }
  let px = 80;
  const series = days.map((date) => {
    px = Math.max(40, px * (1 + (rand() - 0.495) * 0.035));
    return { date, close: Math.round(px * 20) / 20 };
  });
  const prevClose = series[series.length - 1].close;
  const last = Math.round(prevClose * (1 + (rand() - 0.5) * 0.02) * 20) / 20;
  const closes = series.map((s) => s.close).concat(last);
  const change = Math.round((last - prevClose) * 100) / 100;
  return {
    illustrative: true,
    disclaimer: {
      en: 'Illustrative data for design preview only — not a real or live quote. Live prices will be provided by a licensed HKEX market data vendor (delayed at least 15 minutes).',
      tc: '僅供設計預覽之示意數據，並非真實或即時報價。正式網站之股價將由香港交易所認可之市場數據供應商提供（延遲最少15分鐘）。',
      sc: '仅供设计预览之示意数据，并非真实或实时报价。正式网站之股价将由香港交易所认可之市场数据供应商提供（延迟最少15分钟）。',
    },
    symbol: '2020.HK',
    counters: [
      { code: '2020', currency: 'HKD' },
      { code: '82020', currency: 'RMB' },
    ],
    currency: 'HKD',
    asOf: `${asOfDate}T16:10:00+08:00`,
    delayMinutes: 15,
    last,
    change,
    changePct: Math.round((change / prevClose) * 10000) / 100,
    open: prevClose,
    high: Math.max(prevClose, last) + 0.4,
    low: Math.min(prevClose, last) - 0.35,
    prevClose,
    volume: 8_000_000 + Math.floor(rand() * 6_000_000),
    turnover: Math.round(last * 10_000_000),
    week52High: Math.max(...closes),
    week52Low: Math.min(...closes),
    boardLot: 200,
    series,
  };
}
