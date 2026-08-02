import { Plug } from 'lucide-react';
import { useState } from 'react';

type BrandLogoProps = {
  code: string;
  name: string;
  logoDomain?: string;
};

const localLogoPath = (code: string) => `/integrations/logos/${code}.svg`;

const faviconUrl = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

export function BrandLogo({ code, name, logoDomain }: BrandLogoProps) {
  const [sourceIndex, setSourceIndex] = useState(0);

  const sources = [
    localLogoPath(code),
    logoDomain ? faviconUrl(logoDomain) : '',
  ].filter(Boolean);

  const currentSource = sources[sourceIndex];

  if (currentSource) {
    return (
      <span className="plugin-logo" aria-label={`Logo ${name}`}>
        <img
          src={currentSource}
          alt=""
          loading="lazy"
          onError={() => setSourceIndex((current) => current + 1)}
        />
      </span>
    );
  }

  return (
    <span className="plugin-logo plugin-logo-fallback" aria-label={`Logo ${name}`}>
      <Plug size={22} />
    </span>
  );
}

export default BrandLogo;
