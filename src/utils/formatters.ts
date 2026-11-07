/**
 * Financial Formatting Utilities for Indonesian Rupiah (IDR) & Rates
 */

export const formatIDR = (val: number): string => {
  if (isNaN(val)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatCompactIDR = (val: number): string => {
  if (isNaN(val) || val === 0) return 'Rp 0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    const formatted = (abs / 1_000_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
    return `${sign}Rp ${formatted} T`;
  }
  if (abs >= 1_000_000_000) {
    const formatted = (abs / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    });
    return `${sign}Rp ${formatted} M`;
  }
  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    });
    return `${sign}Rp ${formatted} Jt`;
  }
  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toLocaleString('id-ID', {
      maximumFractionDigits: 0,
    });
    return `${sign}Rp ${formatted} Rb`;
  }

  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
};

export const formatNumberWithDots = (val: number): string => {
  if (isNaN(val)) return '0';
  return new Intl.NumberFormat('id-ID').format(val);
};

export const parseNumberFromFormatted = (input: string): number => {
  // Remove non-digit characters except minus
  const cleaned = input.replace(/[^\d-]/g, '');
  if (!cleaned) return 0;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatPercent = (val: number, decimals: number = 1): string => {
  if (isNaN(val)) return '0%';
  return `${val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
};
