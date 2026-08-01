# v23.3 — Country picker e roadmap de internacionalização

## Correção no telefone de usuários

O campo de país/código deixou de usar `<select>` nativo, porque no Windows/navegador ele não renderiza bandeiras corretamente e mostra apenas códigos como `BR`, `US`, `ZA`.

Agora o campo usa um seletor visual próprio:

- miniatura da bandeira por imagem;
- país em ordem alfabética;
- código telefônico;
- Brasil como padrão;
- sem opção WhatsApp;
- tipos mantidos:
  - Celular
  - Fixo
  - Comercial

## Roadmap: internacionalização do produto

Adicionar item no roadmap:

### Internacionalização e seleção de idioma

Preparar o produto para múltiplos idiomas, permitindo que o usuário selecione o idioma na tela de login ou que o sistema sugira automaticamente com base no IP/localidade/navegador.

Idiomas iniciais:

- Português do Brasil
- Inglês americano
- Inglês britânico
- Espanhol
- Alemão
- Francês

Escopo técnico:

- criar dicionário de traduções;
- trocar textos fixos por chaves de tradução;
- salvar preferência de idioma do usuário;
- permitir idioma padrão por cliente;
- permitir seleção manual na tela de login;
- sugerir idioma por IP/localidade/navegador;
- preparar datas, horas, moedas, números e telefones por localidade;
- revisar mensagens de erro, tooltips, botões e status;
- preparar agente para responder no idioma do usuário.

## Aplicação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/apply-v23-3-country-picker-i18n.ps1
npm run build
npm run dev
```
