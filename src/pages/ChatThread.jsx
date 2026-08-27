import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TopBar from '../components/TopBar';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';

const POLL_MS = 4000;

export default function ChatThread() {
  const { otherUserId } = useParams();
  const { user } = useAuth();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOtherUser() {
      try {
        const u = await api.getUserById(otherUserId);
        if (!cancelled) setOtherUser(u);
      } catch {
        // Non-fatal — the thread itself can still load without a name.
      }
    }

    async function loadThread(showSpinner) {
      if (showSpinner) setLoading(true);
      try {
        const msgs = await api.getThread(otherUserId);
        if (!cancelled) {
          setMessages(msgs);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled && showSpinner) setLoading(false);
      }
    }

    loadOtherUser();
    loadThread(true);
    const interval = setInterval(() => loadThread(false), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function handleSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      const sent = await api.sendMessage(otherUserId, text);
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      setError(err.message);
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <TopBar title={otherUser?.username || 'Chat'} />
      <div className="screen" style={{ paddingBottom: 20 }}>
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <EmptyState glyph="👋" title="Say hello" subtitle="Start the conversation below." />
        ) : (
          <div className="thread-scroll">
            {messages.map((m) => (
              <div key={m.id} className={`bubble ${String(m.sender_id) === String(user.id) ? 'mine' : 'theirs'}`}>
                {m.message}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        <form className="composer" onSubmit={handleSend}>
          <input
            placeholder="Type a message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={sending}
          />
          <button type="submit" disabled={sending || !draft.trim()} aria-label="Send">
            ➤
          </button>
        </form>
      </div>
    </>
  );
}
