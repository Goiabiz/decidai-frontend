const MOJIBAKE_PATTERN = /Ã.|Â.|â[€\u0080-\u00BF]?|\uFFFD/;

export function fixMojibake(value: string): string {
  if (!value || !MOJIBAKE_PATTERN.test(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    const originalScore = (value.match(MOJIBAKE_PATTERN) || []).length;
    const decodedScore = (decoded.match(MOJIBAKE_PATTERN) || []).length;

    return decodedScore <= originalScore ? decoded : value;
  } catch {
    return value;
  }
}

export function normalizeTextEncoding<T>(input: T): T {
  if (typeof input === 'string') {
    return fixMojibake(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => normalizeTextEncoding(item)) as T;
  }

  if (input && typeof input === 'object') {
    const output: Record<string, unknown> = {};

    Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
      output[key] = normalizeTextEncoding(value);
    });

    return output as T;
  }

  return input;
}
