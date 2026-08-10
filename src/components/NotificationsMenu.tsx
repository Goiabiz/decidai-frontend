import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read?: boolean;
};

type Props = {
  items?: NotificationItem[];
};

export function NotificationsMenu({ items = [] }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const unreadCount = items.filter((item) => !item.read).length;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current?.contains(target)) return;
      setIsOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  return (
    <div className="notifications-menu-wrap" ref={ref}>
      <button className="icon-btn" title="Notificações" type="button" onClick={() => setIsOpen((value) => !value)}>
        <Bell size={19} />
        {unreadCount > 0 && <em>{unreadCount}</em>}
      </button>

      {isOpen && (
        <div className="notifications-menu align-right">
          <div className="notifications-menu-header">Notificações</div>
          {items.length === 0 ? (
            <div className="notifications-menu-empty">
              <BellOff size={18} />
              <span>Nenhuma notificação por enquanto.</span>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id} className={item.read ? '' : 'unread'}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <small>{item.createdAt}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
