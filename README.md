# Stoxswap

Hosted swap desk for https://stoxswap.com

Assets: XMR, BTC, ETH, TRX, ZEC, SOL, XRP, USDT, USDC.
Quotes: CoinGecko (60s cache), fallback static prices.

Vercel env:
STOX_ADMIN_TOKEN
DEPOSIT_XMR
DEPOSIT_BTC
DEPOSIT_ETH
DEPOSIT_TRX
DEPOSIT_ZEC
DEPOSIT_SOL
DEPOSIT_XRP

For orders that survive deploys, add a GitHub PAT with Contents read/write on ShieldCubed/stoxswap:
GITHUB_ORDERS_TOKEN
Orders are written to data/orders.json.
