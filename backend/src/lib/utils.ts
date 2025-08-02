export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function calculateProfitLoss(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
): { profit: number; percentage: number } {
  if (quantity === 0) {
    return { profit: 0, percentage: 0 };
  }

  const profit = (sellPrice - buyPrice) * quantity;
  const percentage = ((sellPrice - buyPrice) / buyPrice) * 100;

  return {
    profit: Math.round(profit * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
  };
}

export function formatTimestamp(timestamp: Date): string {
  return timestamp.toISOString();
}

export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
