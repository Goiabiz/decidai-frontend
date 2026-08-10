export type CepAddress = {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export function onlyCepDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 8);
}

export function formatCep(value: string) {
  const digits = onlyCepDigits(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/** Busca real na API pública do ViaCEP (Correios). Retorna null se o CEP não existir ou a rede falhar. */
export async function lookupCep(value: string): Promise<CepAddress | null> {
  const digits = onlyCepDigits(value);
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.erro) return null;

    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
    };
  } catch {
    return null;
  }
}
