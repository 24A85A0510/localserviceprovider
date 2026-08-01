import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import ServiceReviewsModal from '../components/ServiceReviewsModal';
import BookingModal from '../components/BookingModal';

const Services = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search, Category, Location & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT'); // DEFAULT, RATING_DESC, PRICE_ASC, PRICE_DESC

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [selectedServiceForReviews, setSelectedServiceForReviews] = useState(null);
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

  useEffect(() => {
    const fetchServicesAndReviews = async () => {
      try {
        const response = await API.get('/services');
        const rawServices = Array.isArray(response.data)
          ? response.data
          : response.data?.content || response.data?.services || [];

        // Fetch rating summaries concurrently using the lightweight endpoint
        const servicesWithRatings = await Promise.all(
          rawServices.map(async (service) => {
            try {
              const summaryRes = await API.get(`/reviews/service/${service.id}/summary`);
              return {
                ...service,
                averageRating: summaryRes.data?.averageRating ?? service.averageRating ?? 0,
                reviewCount: summaryRes.data?.totalReviews ?? service.reviewCount ?? 0,
              };
            } catch (e) {
              return {
                ...service,
                averageRating: service.averageRating ?? service.rating ?? 0,
                reviewCount: service.reviewCount ?? service.reviews?.length ?? 0,
              };
            }
          })
        );

        setServices(servicesWithRatings);
      } catch (err) {
        console.error('Fetch services error:', err);
        setError('Failed to load services.');
      } finally {
        setLoading(false);
      }
    };

    fetchServicesAndReviews();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationTerm, selectedCategory, sortBy]);

  // Helper to infer category if field is omitted or null in backend data
  const getServiceCategory = (service) => {
    if (service.category) return service.category;
    if (service.serviceCategory) return service.serviceCategory;
    if (service.type) return service.type;
    if (service.categoryName) return service.categoryName;

    const title = (service.title || service.name || '').toLowerCase();
    const desc = (service.description || '').toLowerCase();

    if (title.includes('drain') || title.includes('pipe') || desc.includes('water')) return 'Plumbing';
    if (title.includes('electric') || title.includes('wiring') || title.includes('ac')) return 'Electrical';
    if (title.includes('clean') || title.includes('carpet') || title.includes('steam')) return 'Cleaning';
    if (title.includes('mechanic') || title.includes('car') || title.includes('auto')) return 'Automotive';

    return 'General';
  };

  // Build categories with default fallbacks
  const defaultCategories = ['Plumbing', 'AC Repair', 'Electrical', 'Cleaning', 'Automotive', 'Appliance Repair'];
  const fetchedCategories = services
    .map((s) => s.category || s.serviceCategory || s.type || s.categoryName)
    .filter(Boolean);

  const categories = ['ALL', ...new Set([...fetchedCategories, ...defaultCategories])];

  const renderStars = (rating) => {
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;
    return '⭐'.repeat(fullStars) + (hasHalfStar ? '✨' : '');
  };

  // Filter & Sort Logic (including Location filter)
  const filteredAndSortedServices = services
    .filter((service) => {
      const title = (service.title || service.name || '').toLowerCase();
      const desc = (service.description || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch = title.includes(term) || desc.includes(term);

      const location = (service.location || '').toLowerCase();
      const locTerm = locationTerm.toLowerCase();
      const matchesLocation = !locTerm || location.includes(locTerm);

      const category = getServiceCategory(service);
      const matchesCategory =
        selectedCategory === 'ALL' || category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesLocation && matchesCategory;
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
      return 0; // Default order
    });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);
  const indexOfLastService = currentPage * itemsPerPage;
  const indexOfFirstService = indexOfLastService - itemsPerPage;
  const currentServices = filteredAndSortedServices.slice(indexOfFirstService, indexOfLastService);

  // Handler for Book Now button click with Auth check
  const handleBookClick = (service) => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      navigate('/login');
      return;
    }
    setSelectedServiceForBooking(service);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '2rem', fontWeight: 'bold' }}>
        Available Services
      </h2>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: selectedCategory === cat ? '#0284c7' : 'rgba(30, 41, 59, 0.7)',
              color: selectedCategory === cat ? '#fff' : '#cbd5e1',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '13px',
              transition: 'all 0.2s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search, Location & Sort Controls */}
      <div
        style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Title/Keyword Search */}
        <input
          type="text"
          placeholder="🔍 Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '220px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#fff',
            fontSize: '14px',
          }}
        />

        {/* Location Search Bar */}
        <input
          type="text"
          placeholder="📍 Filter by City / Location..."
          value={locationTerm}
          onChange={(e) => setLocationTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '220px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#fff',
            fontSize: '14px',
          }}
        />

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="DEFAULT">Sort By: Default</option>
          <option value="RATING_DESC">⭐ Top Rated</option>
          <option value="PRICE_ASC">💵 Price: Low to High</option>
          <option value="PRICE_DESC">💎 Price: High to Low</option>
        </select>
      </div>

      {error && (
        <p style={{ color: '#f87171', backgroundColor: 'rgba(153, 27, 27, 0.5)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
          {error}
        </p>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading services...</p>
      ) : filteredAndSortedServices.length === 0 ? (
        <p style={{ color: '#94a3b8', marginTop: '20px', textAlign: 'center' }}>No services match your criteria.</p>
      ) : (
        <>
          {/* Services Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {currentServices.map((service) => {
              const numericRating = Number(service.averageRating) || 0;
              const count = service.reviewCount || 0;
              const categoryName = getServiceCategory(service);

              return (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {service.title || service.name || 'Service'}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          color: '#38bdf8',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          border: '1px solid #0284c7',
                        }}
                      >
                        {categoryName}
                      </span>
                    </div>

                    <p style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '12px', lineHeight: '1.5', minHeight: '42px' }}>
                      {service.description || 'No description provided.'}
                    </p>

                    {/* Location Badge */}
                    <p style={{ margin: '6px 0', fontSize: '13px', color: '#38bdf8', fontWeight: '500' }}>
                      📍 {service.location || 'Location Not Specified'}
                    </p>

                    <p style={{ fontWeight: 'bold', fontSize: '1.35rem', color: '#4ade80', margin: '12px 0' }}>
                      ₹{service.price}
                    </p>

                    {/* Interactive Review Badge Button */}
                    <button
                      onClick={() => setSelectedServiceForReviews(service)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginTop: '10px',
                        cursor: 'pointer',
                        color: '#fff',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        {count > 0 ? renderStars(numericRating) : '⭐ New'}
                      </span>
                      <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 'bold' }}>
                        {count > 0
                          ? `${numericRating.toFixed(1)} / 5 (${count}) 💬`
                          : 'View Reviews'}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleBookClick(service)}
                    style={{
                      marginTop: '18px',
                      padding: '12px',
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                    }}
                  >
                    Book Now
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '35px' }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === 1 ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.8)',
                  color: currentPage === 1 ? '#64748b' : '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ◀ Prev
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: currentPage === pageNum ? '#0284c7' : 'rgba(30, 41, 59, 0.8)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                  }}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentPage === totalPages ? 'rgba(30, 41, 59, 0.4)' : 'rgba(30, 41, 59, 0.8)',
                  color: currentPage === totalPages ? '#64748b' : '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}

      {/* Service Reviews Modal Popup */}
      {selectedServiceForReviews && (
        <ServiceReviewsModal
          service={selectedServiceForReviews}
          onClose={() => setSelectedServiceForReviews(null)}
        />
      )}

      {/* Booking Modal Popup */}
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