const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrencyBrl(value: number): string;
export function formatCurrencyBrl(value: number | null | undefined): string | null;
export function formatCurrencyBrl(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return brlFormatter.format(value);
}
