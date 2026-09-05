// Teste real (Playwright/chromium) da conversao de CentralAtendimento.tsx para React Query --
// pagina 12 de 12. App real, banco real, dev server real, sessao staff real via magic link.
//
// Cobre os 9 cenarios do despacho: loading, success, empty, error, mutation, reload, navegacao,
// console, build (o build roda fora, por `npm run build`).
//
// Disciplina herdada do harness anterior desta frente:
//  - "Acessar como cliente" e estado local em React (Manual 05): NAO sobrevive a reload, entao
//    depois de qualquer page.reload() o tenant precisa ser reselecionado.
//  - Nunca remover no gerenciado pelo React; o widget do assistente e escondido por CSS.
//  - Nunca imprimir o actionLink nem tokens (carregam sessao real no hash).
//  - Todo dado criado por este teste e soft-deletado no fim (atendimentos tem `excluido_em`).
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:5182';
const TENANT_LABEL = 'Acessar como: Demonstração';
const TENANT_ID = '404eca76-26b4-4357-9920-ec1ca8a5c067'; // Demonstração
const MARCA = `QA-CA-${Date.now()}`;

const ENV_PATH = 'e:/Armazenamento/Documentos/Projetos/Projeto - IA/Radar SUS/universo-conectasus-agent/.env';
const env = {};
for (const linha of readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(linha.trim());
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const SUPA_URL = env.SUPABASE_URL;
const SUPA_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// ACHADO REAL do proprio teste (05/09): service_role nao tem SELECT em atendimento_mensagens
// nem UPDATE em atendimentos -- 42501, mesma classe GRANT-vs-RLS ja vista em client_tasks,
// usuarios_cliente e service_definitions. Por isso essas duas operacoes vao pela sessao
// autenticada do app (a mesma permissao que a tela usa), nao por service_role.
const ANON_KEY = (() => {
  for (const linha of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = /^VITE_SUPABASE_UNIVERSO_ANON_KEY=(.*)$/.exec(linha.trim());
    if (m) return m[1].replace(/^['"]|['"]$/g, '');
  }
  return null;
})();

// NUNCA imprimir esta URL: e um magic link de sessao real.
const actionLink = JSON.parse(readFileSync('.session-staff.json', 'utf8')).actionLink;

// ACHADO DO FERRAMENTAL (05/09): o `--redirect` do bootstrap-test-session e IGNORADO pelo
// Supabase quando a URL nao esta na allowlist do projeto -- o link cai no Site URL,
// https://app.decidai.io. Um run inteiro deste teste passou 17/19 medindo PRODUCAO enquanto
// dizia medir a mudanca local. E os campos accessToken/refreshToken do arquivo vem `null`
// (o bootstrap gera o link, nao troca por tokens), entao montar o hash na mao tambem nao serve.
// Caminho que funciona: consumir o link no fluxo real, copiar a sessao que o supabase-js gravou
// e injeta-la no dev server -- mesma sessao, mesmo usuario, codigo desta branch.
async function logarNoDevServer(page) {
  await page.goto(actionLink, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const sessao = await page.evaluate(() => {
    const chave = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    return chave ? { chave, valor: localStorage.getItem(chave) } : null;
  });
  if (!sessao) throw new Error('nao consegui obter a sessao do magic link');
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ chave, valor }) => localStorage.setItem(chave, valor), sessao);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
}

const results = [];
function log(label, ok, detail) {
  results.push({ label, ok, detail });
  console.log(`${ok ? 'OK    ' : 'FALHOU'} -- ${label}${detail ? ' :: ' + detail : ''}`);
}

// Conferencia independente da tela: le o banco direto, com service_role.
async function db(path, init) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPA_KEY,
      Authorization: `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers || {}),
    },
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${texto.slice(0, 200)}`);
  return texto ? JSON.parse(texto) : null;
}

// Le/escreve no banco com a MESMA identidade do app (usuario autenticado + RLS), executando
// dentro da pagina para reaproveitar o access_token que o supabase-js guardou no localStorage.
async function dbComoApp(page, caminho, init) {
  return page.evaluate(async ({ caminho, init, url, anon }) => {
    const chave = Object.keys(localStorage).find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    const token = chave ? JSON.parse(localStorage.getItem(chave))?.access_token : null;
    const res = await fetch(`${url}/rest/v1/${caminho}`, {
      method: init?.method || 'GET',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: init?.body,
    });
    const texto = await res.text();
    return { ok: res.ok, status: res.status, corpo: texto ? JSON.parse(texto) : null };
  }, { caminho, init: init || null, url: SUPA_URL, anon: ANON_KEY });
}

async function irParaAtendimentos(page) {
  const grupo = page.locator('.nav-group-button', { hasText: 'Central de Atendimento' }).first();
  await grupo.waitFor({ state: 'visible', timeout: 10000 });
  const abertoJa = await page.locator('.nav-submenu button', { hasText: 'Atendimentos' }).first().isVisible().catch(() => false);
  if (!abertoJa) {
    await grupo.click();
    await page.waitForTimeout(300);
  }
  const item = page.locator('.nav-submenu button').filter({ hasText: /^Atendimentos$/ }).first();
  await item.waitFor({ state: 'visible', timeout: 10000 });
  await item.click();
  await page.waitForTimeout(300);
}

async function irParaAlertas(page) {
  const item = page.locator('.nav-submenu button').filter({ hasText: /^Alertas$/ }).first();
  await item.waitFor({ state: 'visible', timeout: 10000 });
  await item.click();
  await page.waitForTimeout(600);
}

async function selecionarTenant(page) {
  await page.addStyleTag({ content: '.v363-assistant { display: none !important; }' });
  const switcher = page.locator('.support-client-switcher');
  await switcher.waitFor({ state: 'visible', timeout: 15000 });
  await switcher.selectOption({ label: TENANT_LABEL });
  await page.waitForTimeout(1200);
  return switcher.inputValue();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  let idCriado = null;

  let injetando500 = false;
  page.on('requestfailed', (req) => failedRequests.push(req.url()));
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    // O 500 do cenario 10 e produzido pelo proprio teste; contar como erro de console seria
    // reprovar a pagina por um defeito que fui eu que injetei.
    if (injetando500 && /500|Internal Server Error/.test(msg.text())) return;
    // Erro pre-existente do projeto Supabase secundario (POC), cujo DNS nao resolve aqui --
    // acontece igual em paginas que esta missao nao tocou. Nao e regressao.
    const pocPreExistente = msg.text().includes('Failed to load resource')
      && failedRequests.some((u) => u.includes('yjazpxdyitevivbxnmfm.supabase.co'));
    if (!pocPreExistente) consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  try {
    console.log('=== 1: login real (sessao do magic link entregue ao DEV SERVER) ===');
    await logarNoDevServer(page);
    await page.waitForSelector('.sidebar nav button', { timeout: 20000 });
    // Conferencia obrigatoria: o teste tem de estar medindo o dev server, nao producao. Um run
    // anterior passou 17/19 medindo app.decidai.io sem perceber (o --redirect do bootstrap e
    // ignorado pelo Supabase quando a URL nao esta na allowlist do projeto).
    const alvoCerto = page.url().startsWith(BASE) && await page.evaluate(async () => {
      const fonte = await fetch('/src/pages/CentralAtendimento.tsx').then((r) => r.text()).catch(() => '');
      return fonte.includes('atendimento-data-notice');
    });
    log('esta medindo o DEV SERVER com o codigo desta branch', alvoCerto, `origem=${new URL(page.url()).origin}`);
    if (!alvoCerto) throw new Error('teste apontado para o alvo errado -- abortando antes de gerar evidencia falsa');

    const tenantValue = await selecionarTenant(page);
    log('acessou como cliente Demonstração', tenantValue === TENANT_ID, `activeClientId=${tenantValue}`);

    console.log('\n=== 2: LOADING (resposta atrasada de proposito) ===');
    await page.route('**/rest/v1/atendimentos*', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      // A rota pode ja ter sido descartada por unroute quando o atraso termina -- ignorar.
      await route.continue().catch(() => {});
    });
    await irParaAtendimentos(page);
    const textoDuranteCarga = await page.locator('.atendimento-queue').innerText().catch(() => '');
    log('exibe "Carregando..." enquanto a query esta pendente', /Carregando/.test(textoDuranteCarga), textoDuranteCarga.split('\n')[1] || textoDuranteCarga.slice(0, 60));
    await page.waitForTimeout(2500);
    await page.unroute('**/rest/v1/atendimentos*');
    await page.waitForTimeout(500);

    console.log('\n=== 3: SUCCESS (tela x banco, conferido por query independente) ===');
    const noBanco = await db(`atendimentos?cliente_id=eq.${TENANT_ID}&excluido_em=is.null&select=id`);
    const naTela = await page.locator('.atendimento-queue-item').count();
    log('lista da tela bate com a contagem do banco', naTela === noBanco.length, `tela=${naTela} banco=${noBanco.length}`);
    const semAviso = await page.locator('.atendimento-data-notice').count();
    log('sem aviso de origem quando o servidor respondeu', semAviso === 0);

    console.log('\n=== 4: EMPTY (filtro que nao casa, origem saudavel) ===');
    const busca = page.locator('.atendimento-queue input');
    await busca.fill('zzz-nao-existe-nada-assim');
    await page.waitForTimeout(400);
    const textoVazio = await page.locator('.atendimento-queue').innerText();
    log('vazio real diz "Nenhuma demanda encontrada"', /Nenhuma demanda encontrada/.test(textoVazio), textoVazio.split('\n').pop());
    await busca.fill('');
    await page.waitForTimeout(400);

    console.log('\n=== 5: MUTATION criar (modal -> banco) ===');
    await page.locator('.v3464-btn.primary', { hasText: 'Novo atendimento' }).first().click();
    await page.locator('.v3464-system-modal').waitFor({ state: 'visible', timeout: 8000 });
    await page.locator('.v3464-modal-form input').first().fill(`Solicitante ${MARCA}`);
    await page.locator('.v3464-modal-form textarea').first().fill(`Atendimento de teste ${MARCA}`);
    await page.locator('.v3464-primary-btn', { hasText: 'Salvar atendimento' }).click();
    await page.waitForTimeout(2500);
    const criadoNoBanco = await db(`atendimentos?cliente_id=eq.${TENANT_ID}&assunto=like.*${MARCA}*&select=id,status,assunto`);
    idCriado = criadoNoBanco[0]?.id ?? null;
    log('atendimento criado existe no banco', !!idCriado, idCriado ? `id=${idCriado}` : 'nao encontrado');
    const apareceNaLista = await page.locator('.atendimento-queue-item', { hasText: MARCA }).count();
    log('atendimento criado aparece na lista sem reload (invalidateQueries)', apareceNaLista === 1, `ocorrencias=${apareceNaLista}`);

    console.log('\n=== 6: MUTATION status (otimista + evento real na timeline) ===');
    await page.locator('.atendimento-queue-item', { hasText: MARCA }).first().click();
    await page.waitForTimeout(800);
    await page.locator('.atendimento-status-select').selectOption('Em andamento');
    await page.waitForTimeout(2500);
    const statusNoBanco = (await db(`atendimentos?id=eq.${idCriado}&select=status`))[0]?.status;
    log('status novo persistiu no banco', statusNoBanco === 'Em andamento', `banco=${statusNoBanco}`);
    // A conversao trocou a linha temporaria fabricada na tela pelo registro real do banco.
    await page.locator('.atendimento-activity-tabs button', { hasText: 'Atividade' }).click();
    await page.waitForTimeout(800);
    const timeline = await page.locator('.conversation-thread').innerText();
    const eventosResp = await dbComoApp(page, `atendimento_mensagens?atendimento_id=eq.${idCriado}&tipo=eq.sistema&select=id,texto`);
    const eventosNoBanco = eventosResp.ok ? eventosResp.corpo : [];
    log('evento de status aparece na timeline', /Status alterado/.test(timeline), timeline.split('\n').slice(-2).join(' | ').slice(0, 90));
    log('evento da timeline e o registro REAL do banco (sem id temp-)', eventosNoBanco.length > 0 && eventosNoBanco.every((e) => !String(e.id).startsWith('temp-')), `eventos=${eventosNoBanco.length}`);

    console.log('\n=== 7: MUTATION resposta (mensagem publica) ===');
    await page.locator('.atendimento-activity-tabs button', { hasText: 'Comentários' }).click();
    await page.waitForTimeout(400);
    await page.locator('.atendimento-composer textarea').fill(`Resposta de teste ${MARCA}`);
    await page.locator('.v3464-btn.primary', { hasText: /Responder/ }).click();
    await page.waitForTimeout(2500);
    const msgsResp = await dbComoApp(page, `atendimento_mensagens?atendimento_id=eq.${idCriado}&tipo=eq.publica&select=id,texto`);
    const msgsNoBanco = msgsResp.ok ? msgsResp.corpo : [];
    log('mensagem publica persistiu no banco', msgsNoBanco.some((m) => m.texto.includes(MARCA)), `mensagens=${msgsNoBanco.length}`);
    const composerLimpo = await page.locator('.atendimento-composer textarea').inputValue();
    log('composer limpou apos sucesso', composerLimpo === '');

    console.log('\n=== 8: NAVEGACAO (sai e volta, client-side) ===');
    await irParaAlertas(page);
    await irParaAtendimentos(page);
    await page.waitForTimeout(1500);
    const aposNavegar = await page.locator('.atendimento-queue-item').count();
    log('lista intacta ao voltar pela navegacao do menu', aposNavegar === noBanco.length + 1, `itens=${aposNavegar}`);

    console.log('\n=== 9: RELOAD (F5 real -- tenant precisa ser reselecionado, Manual 05) ===');
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await selecionarTenant(page);
    await irParaAtendimentos(page);
    await page.waitForTimeout(2000);
    const aposReload = await page.locator('.atendimento-queue-item', { hasText: MARCA }).count();
    const statusAposReload = await page.locator('.atendimento-queue-item', { hasText: MARCA }).first().innerText();
    log('dado persiste apos reload completo', aposReload === 1 && /Em andamento/.test(statusAposReload), statusAposReload.split('\n').pop());

    console.log('\n=== 10: ERROR (backend 500 -- falha NAO pode virar "nao existe demanda") ===');
    injetando500 = true;
    await page.route('**/rest/v1/atendimentos*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"erro forcado pelo teste"}' }));
    // Recarregar reproduz o caso real (usuario abre a tela com o backend fora); voltar pelo menu
    // serviria o cache do React Query (staleTime 30s) e a tela nunca veria a falha.
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await selecionarTenant(page);
    await irParaAtendimentos(page);
    await page.waitForTimeout(3000);
    const avisoErro = await page.locator('.atendimento-data-notice').innerText().catch(() => '');
    log('tela declara que nao conseguiu consultar o servidor', /N[ãa]o foi poss[ií]vel/.test(avisoErro), avisoErro.slice(0, 90));
    const textoListaErro = await page.locator('.atendimento-queue').innerText();
    const mentiuVazio = /Nenhuma demanda encontrada/.test(textoListaErro);
    log('falha de origem NAO e apresentada como ausencia de negocio', !mentiuVazio, mentiuVazio ? 'exibiu "Nenhuma demanda encontrada"' : 'texto correto de falha');
    await page.unroute('**/rest/v1/atendimentos*');
    injetando500 = false;

    console.log('\n=== 11: CONSOLE ===');
    log('zero erro de console (fora o POC pre-existente)', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  } catch (erro) {
    log('execucao do teste sem excecao', false, String(erro).slice(0, 300));
  } finally {
    console.log('\n=== LIMPEZA: soft-delete de todo dado de teste (inclusive de runs anteriores) ===');
    try {
      const pendentes = await db(`atendimentos?cliente_id=eq.${TENANT_ID}&assunto=like.*QA-CA-*&excluido_em=is.null&select=id,assunto`);
      let limpos = 0;
      for (const item of pendentes) {
        const r = await dbComoApp(page, `atendimentos?id=eq.${item.id}`, { method: 'PATCH', body: JSON.stringify({ excluido_em: new Date().toISOString() }) });
        if (r.ok) limpos += 1;
      }
      const sobrando = await db(`atendimentos?cliente_id=eq.${TENANT_ID}&assunto=like.*QA-CA-*&excluido_em=is.null&select=id`);
      log('sem residuo de teste no tenant Demonstração', sobrando.length === 0, `limpos=${limpos} sobrando=${sobrando.length}`);
    } catch (e) {
      log('sem residuo de teste no tenant Demonstração', false, String(e).slice(0, 200));
    }
    await browser.close();
    const ok = results.filter((r) => r.ok).length;
    console.log(`\nPLACAR: ${ok}/${results.length}`);
    process.exit(ok === results.length ? 0 : 1);
  }
}

main();
