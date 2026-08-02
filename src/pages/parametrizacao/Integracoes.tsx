import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { BrandIcon } from '../../components/BrandIcon';
export type IntegracoesProps={onSelectDetail?: (detail:any)=>void; onOpenDetail?: (detail:any)=>void};
const sections=[
 ['Produtividade e Arquivos',[['Google Drive','drive.google.com'],['Google Docs','docs.google.com'],['Google Sheets','sheets.google.com'],['Google Slides','slides.google.com'],['OneDrive','onedrive.live.com'],['SharePoint','sharepoint.com'],['Dropbox','dropbox.com']]],
 ['Comunicação e Mensageria',[['Gmail','gmail.com'],['Outlook','outlook.com'],['Slack','slack.com'],['Microsoft Teams','teams.microsoft.com'],['WhatsApp Business','whatsapp.com'],['Blip','blip.ai'],['Zenvia','zenvia.com'],['Twilio','twilio.com']]],
 ['Redes Sociais',[['Instagram','instagram.com'],['Threads','threads.net'],['X','x.com'],['Facebook','facebook.com'],['LinkedIn','linkedin.com'],['YouTube','youtube.com'],['TikTok','tiktok.com']]],
 ['Desenvolvimento e Produto',[['GitHub','github.com'],['GitLab','gitlab.com'],['Bitbucket','bitbucket.org'],['Azure DevOps','azure.microsoft.com'],['Vercel','vercel.com'],['Supabase','supabase.com'],['Figma','figma.com']]],
 ['Gestão de Projetos e Trabalho',[['Jira','atlassian.com'],['Jira Service Management','atlassian.com'],['Confluence','atlassian.com'],['Trello','trello.com'],['Monday','monday.com'],['Asana','asana.com'],['ClickUp','clickup.com'],['Notion','notion.so'],['Linear','linear.app']]],
 ['CRM, Comercial e Marketing',[['Salesforce','salesforce.com'],['HubSpot','hubspot.com'],['Pipedrive','pipedrive.com'],['RD Station','rdstation.com'],['Mailchimp','mailchimp.com']]],
 ['ERP, Estoque e Operação Comercial',[['Bling','bling.com.br'],['Tiny ERP','tiny.com.br'],['Conta Azul','contaazul.com'],['Omie','omie.com.br'],['SAP','sap.com'],['Oracle NetSuite','netsuite.com']]],
 ['Financeiro e Pagamentos',[['Stripe','stripe.com'],['Pagar.me','pagar.me'],['Mercado Pago','mercadopago.com.br'],['PayPal','paypal.com'],['Asaas','asaas.com']]],
 ['Dados e Analytics',[['BigQuery','cloud.google.com'],['Power BI','powerbi.microsoft.com'],['Looker Studio','lookerstudio.google.com'],['PostHog','posthog.com'],['Mixpanel','mixpanel.com']]],
 ['Pesquisa, Educação e Conhecimento',[['Google Scholar','scholar.google.com'],['SciSpace','scispace.com'],['Consensus','consensus.app'],['Wolfram','wolframalpha.com']]],
 ['APIs e Conectores Personalizados',[['API personalizada',''],['Webhook de entrada',''],['Webhook de saída',''],['Conector guiado','']]]
];
export function Integracoes(_props:IntegracoesProps){const [q,setQ]=useState('');const filtered=useMemo(()=>sections.map(([s,items]:any)=>[s,items.filter((i:any)=>i[0].toLowerCase().includes(q.toLowerCase()))]).filter(([,items]:any)=>items.length),[q]);return <div className="v3464-page"><div className="v3464-page-head"><h1>Integrações</h1><button className="v3464-btn primary"><Plus size={16}/>Conectar API personalizada</button></div><section className="v3464-card"><p>Catálogo de conectores prontos. Serviços técnicos nativos, como telefonia, Correios e mapas, ficam na intranet/plataforma.</p><div className="v3464-search"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar integração, categoria, plano ou recurso..."/></div>{filtered.map(([section,items]:any)=><div className="v3464-integration-section" key={section}><div className="v3464-section-title"><h2>{section}</h2></div><div className="v3464-plugin-grid">{items.map(([name,domain]:any)=><button className="v3464-plugin" key={name}><BrandIcon label={name} domain={domain}/><span><strong>{name}</strong><small>Conector preparado</small></span></button>)}</div></div>)}</section></div>}
export default Integracoes;
