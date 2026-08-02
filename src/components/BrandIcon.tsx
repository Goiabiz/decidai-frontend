export type BrandIconProps = { domain?: string; label: string; size?: number };
const initials = (label: string) => label.split(/\s+/).filter(Boolean).slice(0,2).map((p)=>p[0]).join('').toUpperCase();
export function BrandIcon({ domain, label, size = 40 }: BrandIconProps) {
  const src = domain ? `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(domain)}` : '';
  return <span className="v3464-brand-icon" style={{ width: size, height: size }} aria-hidden="true">
    {src ? <img src={src} alt="" onError={(e)=>{(e.currentTarget as HTMLImageElement).style.display='none'}} /> : null}
    <b>{initials(label)}</b>
  </span>;
}
export default BrandIcon;
