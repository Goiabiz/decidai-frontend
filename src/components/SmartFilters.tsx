const isCombiningDiacritic = (charCode: number) => charCode >= 0x0300 && charCode <= 0x036f;

export const normalizeFilterText = (value?: string | number | null) =>
  Array.from(String(value ?? '').toLowerCase().normalize('NFD'))
    .filter((char) => !isCombiningDiacritic(char.codePointAt(0) ?? 0))
    .join('');
