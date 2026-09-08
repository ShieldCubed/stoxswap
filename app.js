const ASSET_FALLBACK = [
  { id: "xmr", ticker: "XMR", chain: "Monero" },
  { id: "btc", ticker: "BTC", chain: "Bitcoin" },
  { id: "eth", ticker: "ETH", chain: "Ethereum" },
  { id: "trx", ticker: "TRX", chain: "TRON" },
  { id: "zec", ticker: "ZEC", chain: "Zcash" },
  { id: "sol", ticker: "SOL", chain: "Solana" },
  { id: "usdt_eth", ticker: "USDT", chain: "Ethereum" },
  { id: "usdc_eth", ticker: "USDC", chain: "Ethereum" },
  { id: "usdt_trx", ticker: "USDT", chain: "TRON" },
  { id: "usdc_trx", ticker: "USDC", chain: "TRON" }
];

const fromEl = document.getElementById("from");
const toEl = document.getElementById("to");
const amountEl = document.getElementById("amount");
const receiveEl = document.getElementById("receive");
const feeEl = document.getElementById("fee");
const errEl = document.getElementById("err");

function fill(sel, assets, value) {
  sel.innerHTML = assets.map((a) =>
    `<option value="${a.id}">${a.ticker} · ${a.chain}</option>`
  ).join("");
  if (value) sel.value = value;
}

async function boot() {
  let assets = ASSET_FALLBACK;
  try {
    const res = await fetch("/api/assets");
    const data = await res.json();
    if (data.assets) assets = data.assets;
  } catch {}
  fill(fromEl, assets, "xmr");
  fill(toEl, assets, "usdt_eth");
  refresh();
}

async function refresh() {
  errEl.textContent = "";
  try {
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: fromEl.value, to: toEl.value, amount: amountEl.value })
    });
    const q = await res.json();
    if (!res.ok) throw new Error(q.error);
    receiveEl.value = q.receive;
    feeEl.textContent = `Fee ${(q.feeBps / 100).toFixed(2)}% · ~$${q.feeUsd}`;
  } catch (e) {
    receiveEl.value = "";
    errEl.textContent = e.message;
  }
}

document.getElementById("flip").onclick = () => {
  const a = fromEl.value;
  fromEl.value = toEl.value;
  toEl.value = a;
  refresh();
};

fromEl.addEventListener("change", refresh);
toEl.addEventListener("change", refresh);
amountEl.addEventListener("input", refresh);

document.getElementById("create").onclick = async () => {
  errEl.textContent = "";
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      from: fromEl.value,
      to: toEl.value,
      amount: amountEl.value,
      destination: document.getElementById("destination").value,
      refund: document.getElementById("refund").value
    })
  });
  const order = await res.json();
  if (!res.ok) { errEl.textContent = order.error; return; }
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("oid").textContent = order.id + " · " + order.status;
  document.getElementById("dep").textContent = order.depositAddress;
  document.getElementById("sum").textContent =
    `Send ${order.send} ${order.from}. We pay about ${order.receive} ${order.to} to your destination after settlement.`;
  localStorage.setItem("stox_order_" + order.id, JSON.stringify(order));
  document.getElementById("tracklink").href = "/track.html?id=" + encodeURIComponent(order.id);
};

boot();
