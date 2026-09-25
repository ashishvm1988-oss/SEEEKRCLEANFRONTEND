import { useEffect } from 'react';

// Full-screen photo viewer for a portfolio grid. Click a thumbnail to open,
// click the scrim/close button/Escape to dismiss, and (when there's more than
// one photo) arrow left/right — with on-screen ‹ › buttons plus the keyboard —
// to step through the rest of the portfolio without closing and reopening.
export function Lightbox({ images, index, onClose, onNavigate }) {
  const open = index != null && !!images?.[index];

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && images.length > 1) {
        onNavigate((index + 1) % images.length);
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        onNavigate((index - 1 + images.length) % images.length);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, index, images, onClose, onNavigate]);

  if (!open) return null;
  const img = images[index];

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      {images.length > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index - 1 + images.length) % images.length);
          }}
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      <img
        className="lightbox-img"
        src={img.src}
        alt={img.alt || 'Portfolio image'}
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate((index + 1) % images.length);
          }}
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      {images.length > 1 && (
        <div className="lightbox-count" onClick={(e) => e.stopPropagation()}>
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
