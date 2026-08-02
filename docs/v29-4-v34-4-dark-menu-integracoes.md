# v29.4-v34.4 — Dark mode + Menu + Integrações abertas

## Ajustes

### Tema escuro

- Inputs, selects e textareas deixam de ficar brancos.
- Cards e linhas usam fundo escuro com borda visível.
- Textos principais ficam claros.
- Textos auxiliares ganham contraste melhor.
- Organização visual por contorno, sem blocos brancos estourados.

### Menu lateral

- Corrige `Canais de Atendimento de Atendimento`.
- Prepara classe `sidebar-no-expand` para ocultar seta em itens sem submenu.
- Mantém espaço de alinhamento quando o item não possui expansão.

### Integrações

- Todas as seções ficam abertas por padrão.
- Busca global continua abrindo automaticamente as seções com resultado.
- Usuário ainda pode recolher/expandir manualmente.


## Atualização de conectores de comunicação

Este pacote revisado inclui também:

```text
Blip
Zenvia
Twilio
```

Eles ficam em `Comunicação`, pois são conectores de mensageria, WhatsApp, SMS, atendimento conversacional e APIs de comunicação.

Voz, transcrição, OCR e busca vetorial continuam fora do catálogo do cliente e permanecem como serviços nativos/intranet.
