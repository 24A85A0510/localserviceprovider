import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ServiceReviewsModal from '../components/ServiceReviewsModal';
import BookingModal from '../components/BookingModal';

const Services = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Favorites state (local storage backed)
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fav_services') || '[]');
    } catch {
      return [];
    }
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [onlyFourStarPlus, setOnlyFourStarPlus] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [selectedServiceForReviews, setSelectedServiceForReviews] = useState(null);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  // Read URL query params if redirected from CustomerDashboard
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('query');
    const categoryParam = params.get('category');
    if (queryParam) setSearchTerm(queryParam);
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [location.search]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await API.get('/services');
        const raw = Array.isArray(response.data)
          ? response.data
          : response.data?.content || response.data?.services || [];

        const enriched = await Promise.all(
          raw.map(async (s) => {
            try {
              const res = await API.get(`/reviews/service/${s.id}/summary`);
              return {
                ...s,
                averageRating: res.data?.averageRating ?? s.averageRating ?? 0,
                reviewCount: res.data?.totalReviews ?? s.reviewCount ?? 0,
              };
            } catch {
              return {
                ...s,
                averageRating: s.averageRating ?? s.rating ?? 0,
                reviewCount: s.reviewCount ?? s.reviews?.length ?? 0,
              };
            }
          })
        );
        setServices(enriched);
      } catch (err) {
        console.error('Fetch services error:', err);
        setError('Failed to load services.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationTerm, selectedCategory, onlyFourStarPlus, maxPrice, sortBy]);

  const toggleFavorite = (serviceId) => {
    setFavorites((prev) => {
      const updated = prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId];
      localStorage.setItem('fav_services', JSON.stringify(updated));
      return updated;
    });
  };

  const getServiceCategory = (service) => {
    if (service.category) return service.category;
    if (service.serviceCategory) return service.serviceCategory;
    if (service.type) return service.type;
    if (service.categoryName) return service.categoryName;

    const title = (service.title || service.name || '').toLowerCase();
    const desc = (service.description || '').toLowerCase();

    if (title.includes('drain') || title.includes('pipe') || desc.includes('water') || title.includes('plumb')) return 'Plumbing';
    if (title.includes('electric') || title.includes('wiring') || title.includes('ac')) return 'Electrical';
    if (title.includes('clean') || title.includes('carpet') || title.includes('steam')) return 'Cleaning';
    if (title.includes('mechanic') || title.includes('car') || title.includes('auto')) return 'Automotive';

    return 'General';
  };

  const defaultCategories = ['Plumbing', 'Electrical', 'Cleaning', 'AC Repair', 'Automotive', 'Painting'];
  const fetchedCategories = services
    .map((s) => s.category || s.serviceCategory || s.type || s.categoryName)
    .filter(Boolean);

  const categories = ['ALL', ...new Set([...defaultCategories, ...fetchedCategories])];

  // Filtering & Sorting
  const filteredAndSortedServices = services
    .filter((service) => {
      const title = (service.title || service.name || '').toLowerCase();
      const desc = (service.description || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = title.includes(term) || desc.includes(term);

      const locationStr = (service.location || '').toLowerCase();
      const matchesLocation = !locationTerm || locationStr.includes(locationTerm.toLowerCase());

      const cat = getServiceCategory(service);
      const matchesCategory =
        selectedCategory === 'ALL' || cat.toLowerCase() === selectedCategory.toLowerCase();

      const rating = Number(service.averageRating) || 0;
      const matchesRating = !onlyFourStarPlus || rating >= 4.0;

      const price = Number(service.price) || 0;
      const matchesPrice = price <= maxPrice;

      return matchesSearch && matchesLocation && matchesCategory && matchesRating && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'RATING_DESC') {
        return (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0);
      }
      if (sortBy === 'PRICE_ASC') {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortBy === 'PRICE_DESC') {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);
  const indexOfLastService = currentPage * itemsPerPage;
  const indexOfFirstService = indexOfLastService - itemsPerPage;
  const currentServices = filteredAndSortedServices.slice(indexOfFirstService, indexOfLastService);

  const handleBookClick = (service) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      navigate('/login');
      return;
    }
    setSelectedServiceForBooking(service);
  };

  return (
    <div className="discovery-page-shell">
      <style>{`
        .discovery-page-shell {
          max-width: 1140px;
          margin: 0 auto;
          color: #0f172a;
        }

        .discovery-title-header {
          margin-bottom: 22px;
        }

        .discovery-title-header h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .discovery-title-header p {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        /* FILTER PANEL CONTAINER */
        .filter-control-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 26px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .search-inputs-grid {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .discovery-field {
          background: #ffffff !important;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.88rem;
          color: #0f172a !important;
          outline: none;
        }

        .discovery-field:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        /* CATEGORY PILLS ROW */
        .categories-pill-list {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 6px;
          margin-bottom: 16px;
        }

        .cat-filter-btn {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .cat-filter-btn.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        /* SECONDARY CONTROLS (PRICE SLIDER & 4★ TOGGLE) */
        .secondary-filters-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #f1f5f9;
          padding-top: 14px;
          flex-wrap: wrap;
          gap: 14px;
        }

        .price-slider-group {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.85rem;
          color: #334155;
          font-weight: 600;
        }

        .price-slider-group input[type='range'] {
          accent-color: #2563eb;
          cursor: pointer;
        }

        .checkbox-rating-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 6px 14px;
          border-radius: 8px;
        }

        /* SERVICE CARDS GRID */
        .services-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 22px;
        }

        .provider-service-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .provider-service-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 22px -5px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }

        .fav-heart-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          cursor: pointer;
        }

        .fav-heart-btn.active {
          color: #ef4444;
          border-color: #fca5a5;
          background: #fef2f2;
        }

        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .service-category-tag {
          font-size: 0.75rem;
          color: #2563eb;
          font-weight: 700;
          background: #eff6ff;
          padding: 3px 8px;
          border-radius: 6px;
          display: inline-block;
          margin-right: 6px;
        }

        .service-card-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 8px 0 6px 0;
        }

        .service-card-desc {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.45;
          margin: 0 0 12px 0;
          min-height: 40px;
        }

        .service-provider-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 0.82rem;
          color: #475569;
        }

        .provider-avatar-circle {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2563eb;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .price-badge-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 14px;
        }

        .price-badge-row span {
          font-size: 0.82rem;
          color: #64748b;
        }

        .price-amount {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a;
        }

        .reviews-pill-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          margin-bottom: 14px;
        }

        .book-now-main-btn {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }

        .book-now-main-btn:hover {
          background: #1d4ed8;
        }

        /* PAGINATION */
        .discovery-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 36px;
        }

        .page-num-btn {
          padding: 8px 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .page-num-btn.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .page-num-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        @media (max-width: 820px) {
          .search-inputs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="discovery-title-header">
        <h1>Browse Services & Providers</h1>
        <p>Explore verified professionals, filter by location or price, and book instantly</p>
      </div>

      {/* FILTER PANEL */}
      <div className="filter-control-panel">
        <div className="search-inputs-grid">
          <input
            type="text"
            className="discovery-field"
            placeholder="🔍 Search service name or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <input
            type="text"
            className="discovery-field"
            placeholder="📍 City / Location (e.g. Kurnool)..."
            value={locationTerm}
            onChange={(e) => setLocationTerm(e.target.value)}
          />

          <select
            className="discovery-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="DEFAULT">Sort: Default</option>
            <option value="RATING_DESC">⭐ Rating: High to Low</option>
            <option value="PRICE_ASC">💵 Price: Low to High</option>
            <option value="PRICE_DESC">💎 Price: High to Low</option>
          </select>
        </div>

        {/* Category Filter Pills */}
        <div className="categories-pill-list">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Slider & Rating */}
        <div className="secondary-filters-bar">
          <div className="price-slider-group">
            <span>Budget Up To:</span>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
            <span>₹{maxPrice}</span>
          </div>

          <label className="checkbox-rating-btn">
            <input
              type="checkbox"
              checked={onlyFourStarPlus}
              onChange={(e) => setOnlyFourStarPlus(e.target.checked)}
            />
            <span>⭐ 4.0 & Above Only</span>
          </label>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '14px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Loading available services...</p>
      ) : filteredAndSortedServices.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '40px 20px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 6px 0' }}>No Services Match Your Filters</h3>
          <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Try clearing your search query or expanding the price range slider.</p>
        </div>
      ) : (
        <>
          <div className="services-cards-grid">
            {currentServices.map((service) => {
              const rating = Number(service.averageRating) || 0;
              const count = service.reviewCount || 0;
              const cat = getServiceCategory(service);
              const isFav = favorites.includes(service.id);

              return (
                <div key={service.id} className="provider-service-card">
                  {/* Favorite Button */}
                  <button
                    type="button"
                    className={`fav-heart-btn ${isFav ? 'active' : ''}`}
                    onClick={() => toggleFavorite(service.id)}
                    title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    {isFav ? '❤️' : '🤍'}
                  </button>

                  <div>
                    <div>
                      <span className="service-category-tag">{cat}</span>
                      <span className="verified-badge">✓ Verified</span>
                    </div>

                    <h3 className="service-card-title">{service.title || service.name || 'Service'}</h3>
                    <p className="service-card-desc">{service.description || 'Professional service guaranteed.'}</p>

                    <div className="service-provider-info">
                      <div className="provider-avatar-circle">
                        {(service.providerName || 'P').charAt(0).toUpperCase()}
                      </div>
                      <span>{service.providerName || 'Certified Expert'}</span>
                      <span>•</span>
                      <span>📍 {service.location || 'Local'}</span>
                    </div>

                    <div className="price-badge-row">
                      <span>Starting at</span>
                      <span className="price-amount">₹{service.price}</span>
                    </div>

                    <button
                      type="button"
                      className="reviews-pill-trigger"
                      onClick={() => setSelectedServiceForReviews(service)}
                    >
                      <span>{count > 0 ? `⭐ ${rating.toFixed(1)} / 5` : '⭐ New'}</span>
                      <span style={{ color: '#2563eb' }}>{count > 0 ? `(${count} reviews)` : 'Reviews'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="book-now-main-btn"
                    onClick={() => handleBookClick(service)}
                  >
                    Book Now
                  </button>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="discovery-pagination">
              <button
                type="button"
                className="page-num-btn"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                ◀ Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`page-num-btn ${currentPage === n ? 'active' : ''}`}
                  onClick={() => setCurrentPage(n)}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                className="page-num-btn"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* POPUP MODALS */}
      {selectedServiceForReviews && (
        <ServiceReviewsModal
          service={selectedServiceForReviews}
          onClose={() => setSelectedServiceForReviews(null)}
        />
      )}

      {selectedServiceForBooking && (
        <BookingModal
          service={selectedServiceForBooking}
          onClose={() => setSelectedServiceForBooking(null)}
        />
      )}
    </div>
  );
};

export default Services;