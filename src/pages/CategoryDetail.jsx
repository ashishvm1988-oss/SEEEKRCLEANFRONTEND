import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import TopBar from '../components/TopBar';
import { Spinner, ErrorBanner, EmptyState } from '../components/Feedback';

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([api.getCategories(), api.getSubcategories(id)])
      .then(([cats, subs]) => {
        if (cancelled) return;
        setCategory(cats.find((c) => String(c.id) === String(id)) || null);
        setSubcategories(subs);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <TopBar title={category?.name || 'Category'} onBack={() => navigate('/home')} />
      <div className="screen">
        {error && <ErrorBanner message={error} />}
        {loading ? (
          <Spinner />
        ) : subcategories.length === 0 ? (
          <EmptyState glyph="📂" title="Nothing here yet" subtitle="No services listed under this category yet." />
        ) : (
          <>
            <button
              className="btn btn-secondary btn-block"
              style={{ marginBottom: 16 }}
              onClick={() => navigate(`/search?category_id=${id}`)}
            >
              Browse all in {category?.name}
            </button>
            <div className="tag-grid">
              {subcategories.map((sc) => (
                <span
                  key={sc.id}
                  className="tag"
                  onClick={() => navigate(`/search?sub_category_id=${sc.id}`)}
                >
                  {sc.name}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
