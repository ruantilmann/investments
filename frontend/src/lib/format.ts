const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
});

export function formatMoney(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 'R$ 0,00';
  }

  return moneyFormatter.format(parsed);
}

export function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return dateFormatter.format(parsed);
}

export function humanizeStatus(status: string): string {
  if (status === 'ACTIVE') return 'Ativo';
  if (status === 'WITHDRAWN') return 'Sacado';
  if (status === 'CANCELLED') return 'Cancelado';
  return status;
}
