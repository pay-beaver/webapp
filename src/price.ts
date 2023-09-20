export async function queryTokenPriceBySymbol(
  symbol: string
): Promise<number> {
  const result = await fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`
  );
  const json = await result.json();
  return json.USD;
}
