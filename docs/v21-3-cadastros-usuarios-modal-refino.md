# v21.3 — Usuários: modal refinada

## Correções

- Modal realmente maior.
- Foto em card próprio, no estilo de perfil.
- Input de arquivo oculto.
- Clique no card da foto abre seleção de arquivo.
- Formulário reorganizado por seções:
  - Dados pessoais
  - Contato e endereço
  - Acesso e vínculo
- Telefone redesenhado no padrão da tela.
- Tipo de telefone com ícone.
- Campo de país/DDD com bandeira.
- Tooltips com conteúdo real.
- Campos obrigatórios preservados:
  - E-mail
  - Telefone
  - Perfil
  - Unidade

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v21-3-usuarios-modal-refino.ps1
npm run build
npm run dev
```
