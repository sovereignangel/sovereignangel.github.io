// Live BTC spot price — used by the Finances collateral view (client)
// and the btc-margin cron (server). CoinGecko primary, Coinbase fallback.

export async function fetchBtcPriceUsd(): Promise<number | null> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const price = data?.bitcoin?.usd
      if (typeof price === 'number' && price > 0) return price
    }
  } catch { /* fall through */ }
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const price = parseFloat(data?.data?.amount)
      if (!isNaN(price) && price > 0) return price
    }
  } catch { /* fall through */ }
  return null
}
