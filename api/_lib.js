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

const FALLBACK_USD = {
  xmr: 158, btc: 78492, eth: 2480, trx: 0.12, zec: 42, sol: 145, xrp: 1.39,
  usdt_eth: 1, usdc_eth: 1, usdt_trx: 1, usdc_trx: 1
};

const CG = {
  xmr: "monero", btc: "bitcoin", eth: "ethereum", trx: "tron",
  zec: "zcash", sol: "solana", xrp: "ripple",
  usdt_eth: "tether", usdc_eth: "usd-coin", usdt_trx: "tether", usdc_trx: "usd-coin"
};

const DEPOSITS = {
  xmr: process.env.DEPOSIT_XMR || "8AqeLPshgru5LoGA3jyXudaVyL48umJuwELigxSntaSUZLZ1ByyeUHJeh4fE9x6F8h1jknoe9y7VvXEg1GAzfK8jDHHzYJU",
  btc: process.env.DEPOSIT_BTC || "bc1qyv3edl7tg2eys84yvqk8tzhckaarm8kgyrgk3e",
  eth: process.env.DEPOSIT_ETH || "0xF6B7717E1B794bd39B1C09c6D1E471F3DF4464A3",
  trx: process.env.DEPOSIT_TRX || "TCANH6rmQhkVPCcKAzjJ3GwmBa2oBcywRx",
  zec: process.env.DEPOSIT_ZEC || "t1Zd518kdsEDia6QnupAgsgjw2KMHaJmFEp",
  sol: process.env.DEPOSIT_SOL || "JbfSHvR412J1diYurNkAGmsQAqqzqgJL5UsckhKB4YE",
  xrp: process.env.DEPOSIT_XRP || "rwJYcpBAKGa79RMUNgeGhjTu6ZTwemTdAr",
  usdt_eth: process.env.DEPOSIT_ETH || "0xF6B7717E1B794bd39B1C09c6D1E471F3DF4464A3",
  usdc_eth: process.env.DEPOSIT_ETH || "0xF6B7717E1B794bd39B1C09c6D1E471F3DF4464A3",
  usdt_trx: process.env.DEPOSIT_TRX || "TCANH6rmQhkVPCcKAzjJ3GwmBa2oBcywRx",
  usdc_trx: process.env.DEPOSIT_TRX || "TCANH6rmQhkVPCcKAzjJ3GwmBa2oBcywRx"
};

const g = globalThis;
if (!g.__stoxOrders) g.__stoxOrders = new Map();
if (!g.__stoxRates) g.__stoxRates = { at: 0, usd: { ...FALLBACK_USD } };

async function ratesUsd() {
  const now = Date.now();
  if (now - g.__stoxRates.at < 60000 && g.__stoxRates.usd) return g.__stoxRates.usd;
  try {
    const ids = [...new Set(Object.values(CG))].join(",");
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=" + ids + "&vs_currencies=usd"
    );
    if (!res.ok) throw new Error("coingecko " + res.status);
    const json = await res.json();
    const usd = { ...FALLBACK_USD };
    for (const [asset, id] of Object.entries(CG)) {
      const px = json[id] && json[id].usd;
      if (Number.isFinite(px) && px > 0) usd[asset] = px;
    }
    g.__stoxRates = { at: now, usd };
    return usd;
  } catch {
    return g.__stoxRates.usd || FALLBACK_USD;
  }
}

async function quote(from, to, amount) {
  const send = Number(amount);
  if (!ASSETS[from] || !ASSETS[to] || !Number.isFinite(send) || send <= 0) {
    throw new Error("Invalid pair or amount");
  }
  if (from === to) throw new Error("Choose two different assets");
  const usdTable = await ratesUsd();
  const usd = send * usdTable[from];
  const feeUsd = usd * (FEE_BPS / 10000);
  const receive = (usd - feeUsd) / usdTable[to];
  return {
    from, to, send,
    receive: Number(receive.toFixed(8)),
    feeBps: FEE_BPS,
    feeUsd: Number(feeUsd.toFixed(2)),
    rate: Number((receive / send).toFixed(8)),
    priceFromUsd: usdTable[from],
    priceToUsd: usdTable[to],
    eta: "15-60 minutes after deposit confirms"
  };
}

function validateAddress(asset, value, label) {
  const addr = String(value || "").trim();
  if (!addr || addr.length < 20) throw new Error(label + " looks too short");
  if (/^(refund|destination|your receiving wallet|n\/a|na|none|test)$/i.test(addr)) {
    throw new Error(label + " must be a real wallet address");
  }
  const ok = {
    xmr: /^[48][0-9A-Za-z]{94}$/,
    btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{24,62}$/,
    eth: /^0x[0-9a-fA-F]{40}$/,
    usdt_eth: /^0x[0-9a-fA-F]{40}$/,
    usdc_eth: /^0x[0-9a-fA-F]{40}$/,
    trx: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    usdt_trx: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    usdc_trx: /^T[1-9A-HJ-NP-Za-km-z]{33}$/,
    zec: /^(t1|t3|zs1|u1)[0-9A-Za-z]{20,}$/,
    sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    xrp: /^r[1-9A-HJ-NP-Za-km-z]{24,35}$/
  }[asset];
  if (ok && !ok.test(addr)) {
    throw new Error(label + " does not match " + (ASSETS[asset] && ASSETS[asset].ticker) + " format");
  }
  return addr;
}

const GH_OWNER = process.env.GITHUB_ORDERS_OWNER || "ShieldCubed";
const GH_REPO = process.env.GITHUB_ORDERS_REPO || "stoxswap";
const GH_PATH = "data/orders.json";
const GH_TOKEN = process.env.GITHUB_ORDERS_TOKEN || process.env.GITHUB_TOKEN || "";

async function githubGet() {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "stoxswap",
        ...(GH_TOKEN ? { Authorization: "Bearer " + GH_TOKEN } : {})
      }
    }
  );
  if (res.status === 404) return { sha: null, list: [] };
  if (!res.ok) throw new Error("GitHub read failed " + res.status);
  const body = await res.json();
  const text = Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8");
  const list = JSON.parse(text || "[]");
  return { sha: body.sha, list: Array.isArray(list) ? list : [] };
}

async function loadOrders() {
  try {
    const { list } = await githubGet();
    for (const o of list) if (o && o.id) g.__stoxOrders.set(o.id, o);
  } catch {}
  return g.__stoxOrders;
}

async function saveOrder(order) {
  g.__stoxOrders.set(order.id, order);
  if (!GH_TOKEN) return order;
  try {
    const { sha, list } = await githubGet();
    const next = list.filter((o) => o.id !== order.id);
    next.unshift(order);
    const content = Buffer.from(JSON.stringify(next.slice(0, 500), null, 2)).toString("base64");
    await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + GH_TOKEN,
          "User-Agent": "stoxswap",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "order " + order.id + " " + order.status,
          content,
          sha: sha || undefined
        })
      }
    );
  } catch {}
  return order;
}

module.exports = {
  ASSETS, DEPOSITS, quote, validateAddress, loadOrders, saveOrder, orders: g.__stoxOrders
};
