# v23.2 — Fix menu e Usuários

## Menu

- Corrige diferença entre menu fixo e menu aberto por hover.
- Garante que submenus exibam texto + ícone quando o menu estiver aberto por hover.
- Mantém somente ícones quando o menu estiver recolhido.

## Usuários

- Substitui o arquivo `Usuarios.tsx`.
- Remove o tipo de telefone WhatsApp.
- Mantém somente:
  - Celular
  - Fixo
  - Comercial
- Celular usa ícone de smartphone.
- Unidade deixa de ser obrigatória.
- Campo passa de Sexo para Gênero.
- Gênero:
  - Feminino
  - Masculino
- Lista de código de país fica ordenada alfabeticamente por país.
- Código de país exibe bandeira + país + código.
- Brasil continua como padrão.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v23-2-fix-menu-usuarios.ps1
npm run build
npm run dev
```
