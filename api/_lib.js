const ASSETS = {
  xmr: { id: "xmr", ticker: "XMR", name: "Monero", chain: "Monero" },
  btc: { id: "btc", ticker: "BTC", name: "Bitcoin", chain: "Bitcoin" },
  eth: { id: "eth", ticker: "ETH", name: "Ethereum", chain: "Ethereum" },
  trx: { id: "trx", ticker: "TRX", name: "TRON", chain: "TRON" },
  zec: { id: "zec", ticker: "ZEC", name: "Zcash", chain: "Zcash" },
  sol: { id: "sol", ticker: "SOL", name: "Solana", chain: "Solana" },
  xrp: { id: "xrp", ticker: "XRP", name: "XRP", chain: "XRP Ledger" },
  usdt_eth: { id: "usdt_eth", ticker: "USDT", name: "Tether", chain: "Ethereum" },
  usdc_eth: { id: "usdc_eth", ticker: "USDC", name: "USD Coin", chain: "Ethereum" },
  usdt_trx: { id: "usdt_trx", ticker: "USDT", name: "Tether", chain: "TRON" },
  usdc_trx: { id: "usdc_trx", ticker: "USDC", name: "USD Coin", chain: "TRON" }
};

const FEE_BPS = Number(process.env.STOX_FEE_BPS || 50);

const RATES_USD = {
  xmr: 158, btc: 78492, eth: 2480, trx: 0.12, zec: 42, sol: 145, xrp: 1.39,
  usdt_eth: 1, usdc_eth: 1, usdt_trx: 1, usdc_trx: 1
};

const DEPOSITS = {
  xmr: process.env.DEPOSIT_XMR || "4ReplaceMeWithYourXmrHotWallet",
  btc: process.env.DEPOSIT_BTC || "bc1qyv3edl7tg2eys84yvqk8tzhckaarm8kgyrgk3e",
  eth: process.env.DEPOSIT_ETH || "0xReplaceMeWithYourEthHotWallet",
  trx: process.env.DEPOSIT_TRX || "TReplaceMeWithYourTrxHotWallet",
  zec: process.env.DEPOSIT_ZEC || "t1ReplaceMeWithYourZecTransparentAddress",
  sol: process.env.DEPOSIT_SOL || "ReplaceMeWithYourSolanaAddress",
  xrp: process.env.DEPOSIT_XRP || "rReplaceMeWithYourXrpAddress",
  usdt_eth: process.env.DEPOSIT_ETH || "0xReplaceMeWithYourEthHotWallet",
  usdc_eth: process.env.DEPOSIT_ETH || "0xReplaceMeWithYourEthHotWallet",
  usdt_trx: process.env.DEPOSIT_TRX || "TReplaceMeWithYourTrxHotWallet",
  usdc_trx: process.env.DEPOSIT_TRX || "TReplaceMeWithYourTrxHotWallet"
};

function quote(from, to, amount) {
  const send = Number(amount);
  if (!ASSETS[from] || !ASSETS[to] || !Number.isFinite(send) || send <= 0) {
    throw new Error("Invalid pair or amount");
  }
  if (from === to) throw new Error("Choose two different assets");
  const usd = send * RATES_USD[from];
  const feeUsd = usd * (FEE_BPS / 10000);
  const receive = (usd - feeUsd) / RATES_USD[to];
  return {
    from, to, send,
    receive: Number(receive.toFixed(8)),
    feeBps: FEE_BPS,
    feeUsd: Number(feeUsd.toFixed(2)),
    rate: Number((receive / send).toFixed(8)),
    eta: "15-60 minutes after deposit confirms"
  };
}

const g = globalThis;
if (!g.__stoxOrders) g.__stoxOrders = new Map();

module.exports = { ASSETS, DEPOSITS, quote, orders: g.__stoxOrders };
