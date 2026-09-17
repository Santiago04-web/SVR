/**
 * Format numbers into Colombian Pesos (COP)
 * Example: 587000 -> "$ 587.000"
 */
export function formatCOP(
  amount: number,
  showSign: boolean = false,
  isMasked: boolean = false
): string {
  if (isMasked) {
    return '$ ••••••';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(absAmount)
    .replace('COP', '$')
    .trim();

  if (isNegative) {
    return `-${formatted}`;
  }
  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Compact COP format for tight UI elements
 * Example: 587000 -> "$587k", 2000000 -> "$2.0M"
 */
export function formatCompactCOP(amount: number, isMasked: boolean = false): string {
  if (isMasked) {
    return '$ •••';
  }

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1_000_000) {
    const value = (absAmount / 1_000_000).toFixed(1).replace('.0', '');
    return `${sign}$${value}M`;
  }
  if (absAmount >= 1_000) {
    const value = Math.round(absAmount / 1_000);
    return `${sign}$${value}k`;
  }
  return `${sign}$${absAmount}`;
}

export function formatPercentage(val: number): string {
  return `${Math.min(100, Math.max(0, Math.round(val)))}%`;
}
