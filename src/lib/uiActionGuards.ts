type ModalOptions = { title: string; body?: string; fields?: string[]; confirm?: string; kind?: 'default'|'export'|'assistant' };
const ensure = () => { if (typeof document === 'undefined') return null; let root = document.getElementById('platform-action-root'); if (!root) { root = document.createElement('div'); root.id = 'platform-action-root'; document.body.appendChild(root); } return root; };
const closeModal = () => { const root = ensure(); if(root) root.innerHTML=''; };
const openModal = (opts: ModalOptions) => {
  const root = ensure(); if(!root) return;
  const fields = opts.kind === 'export'
    ? `<div class="v3464-modal-grid"><label>Formato<select><option>XLS</option><option>PDF</option></select></label><label>Orientação<select><option>Paisagem</option><option>Retrato</option></select></label></div>`
    : (opts.fields || ['Nome','Descrição']).map(f=>`<label>${f}<input placeholder="Informe ${f.toLowerCase()}" /></label>`).join('');
  root.innerHTML = `<div class="v3464-modal-backdrop"><section class="v3464-system-modal"><button class="v3464-modal-x" data-close-action="1">×</button><h2>${opts.title}</h2>${opts.body?`<p>${opts.body}</p>`:''}<div class="v3464-modal-form">${fields}</div><footer><button data-close-action="1" class="v3464-secondary-btn">Cancelar</button><button data-close-action="1" class="v3464-primary-btn">${opts.confirm || 'Salvar'}</button></footer></section></div>`;
};
const toast = (message: string) => { if(typeof document === 'undefined') return; const el=document.createElement('div'); el.className='v3464-toast'; el.textContent=message; document.body.appendChild(el); setTimeout(()=>el.remove(),2200); };
const installAssistant = () => { if(typeof document === 'undefined' || document.getElementById('platform-assistant-widget')) return; const btn=document.createElement('button'); btn.id='platform-assistant-widget'; btn.className='v3464-assistant-widget'; btn.innerHTML='✦'; btn.title='Assistente da plataforma'; btn.addEventListener('click',()=>openModal({title:'Assistente da plataforma',body:'Posso orientar o uso desta tela, explicar campos e sugerir próximos passos.',fields:['Pergunta ou orientação desejada'],confirm:'Enviar',kind:'assistant'})); document.body.appendChild(btn); };
const pageTitle = () => (document.querySelector('h1')?.textContent || '').trim();
const normalize = () => {
  if(typeof document === 'undefined') return;
  const title = pageTitle();
  // Relatórios padrões: sem Novo registro e sem indicadores grandes; deixa totalizadores pequenos quando existirem.
  if(/^Relatório de /i.test(title)){
    document.querySelectorAll('button').forEach((b)=>{ if((b.textContent||'').trim().toLowerCase()==='novo registro') (b as HTMLElement).style.display='none'; });
    document.querySelectorAll('.kpi-grid,.metrics-grid,.indicator-grid,.v346-kpis,.v3464-kpis').forEach((el)=>{ (el as HTMLElement).style.display='none'; });
  }
  // Área e Roadmap não são grupo expansível, mantém espaço mas esconde chevron solto se existir no item.
  document.querySelectorAll('nav *').forEach((el)=>{ const txt=(el.textContent||'').trim(); if(txt==='Área de Trabalho' || txt==='Roadmap'){ const svgs=Array.from(el.querySelectorAll('svg')) as SVGElement[]; if(svgs.length>1){ const last=svgs[svgs.length-1] as any; last.style.visibility='hidden'; last.style.pointerEvents='none'; } } });
};
const handler = (ev: MouseEvent) => {
  const target = ev.target as HTMLElement | null; const btn = target?.closest('button') as HTMLButtonElement | null; if(!btn) return;
  if(btn.dataset.closeAction){ closeModal(); return; }
  const text=(btn.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  const map: Array<[RegExp, ModalOptions]> = [
    [/novo atendimento|criar atendimento/, {title:'Novo atendimento', body:'Registre uma demanda recebida por canal, e-mail, ticket, API ou atendimento manual.', fields:['Origem','Cliente ou solicitante','Resumo','Prioridade'], confirm:'Salvar atendimento'}],
    [/novo canal/, {title:'Novo canal de atendimento', body:'Canal é o uso operacional. Integração é a conexão técnica usada por esse canal.', fields:['Nome do canal','Tipo de canal','Integração usada','Fila/SLA','Agente padrão'], confirm:'Salvar canal'}],
    [/novo agente/, {title:'Novo agente', body:'Configure identidade, prompt/contexto, fluxos e pontos de uso. Limites técnicos são controlados pelo plano no backend.', fields:['Nome do agente','Objetivo','Prompt / contexto','Fluxos de uso'], confirm:'Salvar agente'}],
    [/criar tarefa|nova tarefa/, {title:'Criar tarefa', body:'Crie uma tarefa vinculada ao roadmap, atendimento, alerta, conhecimento ou integração.', fields:['Descrição','Origem','Responsável','Prazo','Prioridade'], confirm:'Salvar tarefa'}],
    [/exportar consulta|gerar xls|gerar pdf|exportar/, {title:'Exportar consulta', body:'Escolha formato e orientação antes de gerar o arquivo.', confirm:'Gerar exportação', kind:'export'}]
  ];
  const item = map.find(([rx])=>rx.test(text));
  if(item){ ev.preventDefault(); ev.stopPropagation(); openModal(item[1]); }
};
if(typeof document !== 'undefined'){
  window.addEventListener('DOMContentLoaded',()=>{ installAssistant(); normalize(); });
  document.addEventListener('click', handler, true);
  setInterval(normalize, 1400);
}
export {};
