# v27-v28 — Agentes, Canais e base de banco

## Escopo

Este pacote junta:

- correção de caracteres especiais com dupla codificação;
- toast central no topo, sumindo em 2 segundos;
- base para delay de hover do menu lateral;
- tela `Parametrização > Agentes`;
- tela `Parametrização > Canais`;
- migration inicial para agentes, canais, planos, limites, permissões e consumo;
- seed inicial de planos e canais;
- consulta de diagnóstico.

## Aplicação frontend

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v27-v28-agentes-canais.ps1
npm run build
npm run dev
```

Depois:

```text
Ctrl + F5
```

## Auditoria de charset

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit-charset-v27-v28.ps1
```

## Banco

Arquivos incluídos:

```text
database/01_migrations/019_agent_channels_plans_base.sql
database/02_seeds/019_agent_channels_plans_base_seed.sql
database/03_scripts_operacionais/consultas_diagnostico/diagnostico_019_agentes_canais_planos.sql
```

## Observação importante

A aplicação atual é o ambiente de produção do cliente.  
A intranet/plataforma virá depois para controlar planos, clientes, ambientes, liberações, consumo e automações comerciais.

Neste pacote, o banco já nasce preparado para esse futuro, mas as telas ainda validam conceito e fluxo.
