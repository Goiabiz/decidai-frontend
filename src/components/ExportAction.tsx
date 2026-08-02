import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
export function ExportAction({ label='Exportar consulta' }: { label?: string }){
  const [open,setOpen]=useState(false);
  const [format,setFormat]=useState<'XLS'|'PDF'>('XLS');
  const [orientation,setOrientation]=useState<'Paisagem'|'Retrato'>('Paisagem');
  return <div className="v3464-export">
    <button className="v3464-btn secondary" onClick={()=>setOpen(v=>!v)}><Download size={16}/>{label}</button>
    {open&&<div className="v3464-export-menu">
      <strong>Exportação</strong>
      <label>Formato<select value={format} onChange={(e)=>setFormat(e.target.value as any)}><option>XLS</option><option>PDF</option></select></label>
      {format==='PDF'&&<label>Orientação<select value={orientation} onChange={(e)=>setOrientation(e.target.value as any)}><option>Paisagem</option><option>Retrato</option></select></label>}
      <button className="v3464-btn primary" onClick={()=>setOpen(false)}>{format==='XLS'?<FileSpreadsheet size={16}/>:<FileText size={16}/>}Gerar {format}</button>
    </div>}
  </div>;
}
export default ExportAction;
