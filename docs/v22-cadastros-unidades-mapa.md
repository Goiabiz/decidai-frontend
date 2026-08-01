# v22 — Cadastros > Unidades com mapa

## Objetivo

Criar a tela funcional de Unidades, com espaço reservado para mapa da unidade e atalho de visualização de mapa nos detalhes.

## Entregue

- Tipos:
  - Matriz
  - Filial
  - Prestador
  - Fornecedor
  - Cliente

- Sem grupo da unidade.

- Setores dentro da unidade.

- Campos comuns:
  - Nome
  - Tipo
  - Status
  - Unidade superior
  - Código interno
  - Responsável
  - E-mail
  - Telefone
  - Endereço estruturado
  - Latitude
  - Longitude
  - Setores

- Dados complementares dinâmicos por tipo.

- Endereço estruturado:
  - CEP
  - Logradouro
  - Número
  - Complemento
  - Bairro
  - Cidade
  - UF
  - País
  - Latitude
  - Longitude

- Espaço para mapa no cadastro.

- Atalho "Visualizar mapa" nos detalhes.

- Modal de mapa da unidade.

- Modais menores de Importar e Exportar.

## Roadmap técnico relacionado

- Integração Correios/ViaCEP para busca por CEP.
- Integração Google Maps ou outro provedor para geocodificação.
- Gravação de latitude/longitude.
- Exibição real de mapa.
- Cálculo futuro de distância, rota e tempo estimado.
- Evolução para entrega, coleta ou deslocamento com lógica comercial similar a estimativa de corrida/entrega.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v22-unidades-mapa.ps1
npm run build
npm run dev
```
