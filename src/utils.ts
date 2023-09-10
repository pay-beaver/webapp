export function shortenAddress(address: string): string {
  return `${address.slice(0, 5)}...${address.slice(-3)}`;
}

export function secondsToWord(seconds: number): string {
  switch (seconds) {
    case 60:
      return "1 minute";
    case 5 * 60:
      return "5 minutes";
    case 24 * 60 * 60:
      return "1 day";
    case 7 * 24 * 60 * 60:
      return "1 week";
    case 30 * 24 * 60 * 60:
      return "1 month";
    default:
      return `${seconds} seconds`;
  }
}
