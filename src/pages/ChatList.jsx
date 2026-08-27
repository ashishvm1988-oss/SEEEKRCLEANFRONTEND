import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';
import { initials, timeAgo } from '../utils/format';

export default function ChatList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getConversations()
      .then((res) => !cancelled && setConversations(res))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="screen">
      <div className="section-title" style={{ marginTop: 4 }}>Chats</div>
      {error && <ErrorBanner message={error} />}
      {loading ? (
        <Spinner />
      ) : conversations.length === 0 ? (
        <EmptyState glyph="💬" title="No conversations yet" subtitle="Message a provider from their profile to get started." />
      ) : (
        conversations.map((c) => (
          <div key={c.other_user_id} className="conversation-row" onClick={() => navigate(`/chat/${c.other_user_id}`)}>
            <div className="avatar">{initials(c.user.username)}</div>
            <div className="meta">
              <div className="name">
                <span>{c.user.username}</span>
                <span className="time">{timeAgo(c.last_message_at)}</span>
              </div>
              <div className="preview">{c.last_message}</div>
            </div>
            {c.unread && <span className="unread-dot" />}
          </div>
        ))
      )}
    </div>
  );
}
