# v21.2 — Usuários: formulário completo

## Ajustes feitos

- Remove a seção "Estrutura do cadastro".
- Mantém a tela mais funcional.
- Inclui ícones de informação com tooltip nos campos.
- Aumenta a modal de cadastro.
- Remove o texto "Cadastro inicial para acesso ao ambiente".
- Inclui foto do usuário.
- Inclui endereço.
- Inclui sexo.
- Inclui data de nascimento.
- Inclui país/DDD com bandeira no telefone.
- Permite adicionar mais telefones.
- Mantém celular como primeiro telefone.
- Adiciona validação de CPF.
- Adiciona validação de e-mail.
- Adiciona validação de telefone.
- Marca obrigatórios:
  - E-mail
  - Telefone
  - Perfil
  - Unidade
- Altera "Enviar convite" para "Enviar/Reenviar convite".

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v21-2-usuarios-form-completo.ps1
npm run build
npm run dev
```
