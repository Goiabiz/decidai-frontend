import { Lock } from 'lucide-react';

export type ThreadMessage = {
  id: string;
  autor: string;
  tipo: 'publica' | 'interna';
  texto: string;
  criadoEm: string;
};

type ConversationThreadProps = {
  messages: ThreadMessage[];
  /** Portal do Cliente usa false aqui — o cliente final nunca vê notas internas. */
  showInternal?: boolean;
};

export function ConversationThread({ messages, showInternal = true }: ConversationThreadProps) {
  const visible = showInternal ? messages : messages.filter((message) => message.tipo === 'publica');

  if (visible.length === 0) {
    return <p className="empty-note">Nenhuma mensagem ainda.</p>;
  }

  return (
    <div className="conversation-thread">
      {visible.map((message) => (
        <div key={message.id} className={`thread-message ${message.tipo}`}>
          <div className="thread-message-head">
            <strong>{message.autor}</strong>
            {message.tipo === 'interna' && <span className="thread-internal-tag"><Lock size={11} /> Nota interna</span>}
            <small>{message.criadoEm}</small>
          </div>
          <p>{message.texto}</p>
        </div>
      ))}
    </div>
  );
}

export default ConversationThread;
