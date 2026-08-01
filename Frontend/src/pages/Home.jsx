import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';

const Home = () => {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Dynamic greeting based on current time
  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 18
      ? 'Good Afternoon'
      : 'Good Evening';

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Valued Guest';

  // State for fetched services
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Category, Location & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');

  // Pagination State (Strictly 2 services per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  // Fetch Services & Ratings on Mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await API.get('/services');
        const rawServices = Array.isArray(response.data)
          ? response.data
          : response.data?.content || response.data?.services || [];

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
        console.error('Fetch home services error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Reset to Page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, locationTerm, selectedCategory, sortBy]);

  // Infer Category Helper
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

  // Filter & Sort Logic
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
      return 0;
    });

  // Slice exactly 2 services for current page
  const totalPages = Math.ceil(filteredAndSortedServices.length / itemsPerPage);
  const indexOfLastService = currentPage * itemsPerPage;
  const indexOfFirstService = indexOfLastService - itemsPerPage;
  const currentServices = filteredAndSortedServices.slice(indexOfFirstService, indexOfLastService);

  // Handle Book Now Click
  const handleBookClick = () => {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      navigate('/login');
    } else {
      navigate('/services');
    }
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'sans-serif' }}>

      {/* ---------------------------------------------------- */}
      {/* SCROLLING MARQUEE BANNER */}
      {/* ---------------------------------------------------- */}
      <div
        style={{
          width: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          backgroundColor: '#111827',
          borderBottom: '1px solid #1f2937',
          padding: '16px 0',
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <style>{`
          @keyframes scrollMarquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .scrolling-text {
            display: inline-block;
            animation: scrollMarquee 40s linear infinite;
          }
          .scrolling-text:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="scrolling-text" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
          <span style={{ color: '#38bdf8', textShadow: '0 0 10px rgba(56,189,248,0.6)' }}>
            ✨ {timeGreeting}, {userDisplayName}! Welcome to Local Service Provider platform.
          </span>
          <span style={{ color: '#aaa', margin: '0 30px' }}>•</span>
          <span style={{ color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.6)' }}>
            ⚡ Need instant home assistance? Book top-rated local technicians in seconds!
          </span>
          <span style={{ color: '#aaa', margin: '0 30px' }}>•</span>
          <span style={{ color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.6)' }}>
            🛡️ 100% Background-Verified Experts & Transparent Pricing Guaranteed.
          </span>
          <span style={{ color: '#aaa', margin: '0 30px' }}>•</span>
          <span style={{ color: '#f59e0b', textShadow: '0 0 10px rgba(245,158,11,0.6)' }}>
            📞 24/7 Support available via WhatsApp & Direct Helpline!
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FULL-HEIGHT LIVE VIDEO BACKGROUND WRAPPER */}
      {/* ---------------------------------------------------- */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>

        {/* Background Live Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
          }}
        >
          <source src="/blue-space-black-hole-live-wallpaper.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1,
          }}
        />

        {/* Foreground Content */}
        <div style={{ position: 'relative', zIndex: 2, paddingBottom: '100px' }}>

          {/* HERO SECTION */}
          <div
            style={{
              minHeight: 'calc(100vh - 80px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '30px 20px',
              maxWidth: '1100px',
              margin: '0 auto',
            }}
          >
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.2', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
              Your Most <span style={{ color: '#007bff' }}>Trusted & Verified</span> Local Service Partner
            </h1>

            <p style={{ marginTop: '20px', fontSize: '1.5rem', color: '#ddd', textShadow: '0 2px 10px rgba(0,0,0,0.8)', maxWidth: '850px', lineHeight: '1.5' }}>
              Connecting you directly with background-checked local experts for plumbing, electrical work, cleaning, and appliance servicing.
            </p>

            {token ? (
              <div
                style={{
                  marginTop: '30px',
                  padding: '20px 36px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(26, 26, 26, 0.75)',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-block',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: '#28a745', fontSize: '1.5rem' }}>Status: Logged In ✅</h3>
                {user && <p style={{ margin: 0, fontSize: '1.3rem', color: '#eee' }}>User: {user.email || user.name}</p>}
              </div>
            ) : (
              <p style={{ marginTop: '25px', fontSize: '1.3rem', color: '#bbb', textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
                Please log in or register to access local service listings.
              </p>
            )}

            {/* Scroll Indicator Arrow */}
            <div style={{ marginTop: '50px', fontSize: '1.1rem', color: '#aaa', animation: 'bounce 2s infinite' }}>
              <style>{`
                @keyframes bounce {
                  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                  40% { transform: translateY(-10px); }
                  60% { transform: translateY(-5px); }
                }
              `}</style>
              <p style={{ margin: 0, fontWeight: '500' }}>Scroll down to view & search services</p>
              <span style={{ fontSize: '2rem', display: 'block', marginTop: '6px' }}>↓</span>
            </div>
          </div>

          {/* AVAILABLE SERVICES SECTION */}
          <div style={{ padding: '60px 20px 0 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.8rem', marginBottom: '30px', fontWeight: 'bold', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              Available Services
            </h2>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '30px' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: selectedCategory === cat ? '#007bff' : 'rgba(20, 20, 20, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: selectedCategory === cat ? '#fff' : '#ccc',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search, Location Filter & Sort Dropdown */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '35px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '260px',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(17, 17, 17, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />

              <input
                type="text"
                placeholder="📍 Filter by City / Location..."
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '260px',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(17, 17, 17, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(17, 17, 17, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                <option value="DEFAULT">Sort By: Default</option>
                <option value="RATING_DESC">⭐ Top Rated</option>
                <option value="PRICE_ASC">💵 Price: Low to High</option>
                <option value="PRICE_DESC">💎 Price: High to Low</option>
              </select>
            </div>

            {/* Services Grid */}
            {loading ? (
              <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Loading services...</p>
            ) : filteredAndSortedServices.length === 0 ? (
              <p style={{ color: '#aaa', marginTop: '20px', fontSize: '1.2rem' }}>No services match your search criteria.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '30px' }}>
                  {currentServices.map((service) => {
                    const numericRating = Number(service.averageRating) || 0;
                    const count = service.reviewCount || 0;
                    const categoryName = getServiceCategory(service);

                    return (
                      <div
                        key={service.id}
                        style={{
                          backgroundColor: 'rgba(20, 20, 20, 0.9)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          padding: '28px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          textAlign: 'left',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
                              {service.title || service.name || 'Service'}
                            </h3>
                            <span
                              style={{
                                fontSize: '12px',
                                backgroundColor: '#1e293b',
                                color: '#38bdf8',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                border: '1px solid #0284c7',
                              }}
                            >
                              {categoryName}
                            </span>
                          </div>

                          <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '16px', lineHeight: '1.5', minHeight: '48px' }}>
                            {service.description || 'No description provided.'}
                          </p>

                          <p style={{ margin: '8px 0', fontSize: '1.1rem', color: '#38bdf8', fontWeight: '500' }}>
                            📍 {service.location || 'Location Not Specified'}
                          </p>

                          <p style={{ fontWeight: 'bold', fontSize: '1.5rem', color: '#22c55e', margin: '14px 0' }}>
                            ₹{service.price}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                              padding: '10px 14px',
                              borderRadius: '6px',
                              margin: '12px 0',
                              fontSize: '1rem',
                            }}
                          >
                            <span>{count > 0 ? renderStars(numericRating) : '⭐ New'}</span>
                            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                              {count > 0 ? `${numericRating.toFixed(1)} / 5 (${count})` : 'View Reviews'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={handleBookClick}
                          style={{
                            marginTop: '18px',
                            padding: '14px',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            width: '100%',
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
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '40px' }}>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '10px 18px',
                        backgroundColor: currentPage === 1 ? 'rgba(20,20,20,0.5)' : '#222',
                        color: currentPage === 1 ? '#555' : '#fff',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '1.05rem',
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
                          padding: '10px 18px',
                          backgroundColor: currentPage === pageNum ? '#007bff' : '#222',
                          color: '#fff',
                          border: '1px solid #444',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                          fontSize: '1.05rem',
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '10px 18px',
                        backgroundColor: currentPage === totalPages ? 'rgba(20,20,20,0.5)' : '#222',
                        color: currentPage === totalPages ? '#555' : '#fff',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '1.05rem',
                        fontWeight: 'bold',
                      }}
                    >
                      Next ▶
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. FULL-WIDTH CONTACT US SECTION */}
      {/* ---------------------------------------------------- */}
      <div style={{ backgroundColor: '#0b0f17', borderTop: '1px solid #1a2234', padding: '60px 40px 40px 40px', width: '100%' }}>

        <div style={{ borderTop: '1px solid #222d42', width: '100%', marginBottom: '30px' }} />

        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: '600',
            letterSpacing: '4px',
            color: '#ffffff',
            fontFamily: 'serif, Georgia',
            textTransform: 'uppercase',
            marginBottom: '30px',
            textAlign: 'center',
          }}
        >
          CONTACT US
        </h2>

        <div style={{ borderTop: '1px solid #222d42', width: '100%', marginBottom: '50px' }} />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '40px',
            width: '100%',
          }}
        >
          {/* LEFT SIDE: Contact Info */}
          <div style={{ flex: '1', minWidth: '350px', textAlign: 'left', paddingRight: '20px' }}>
            <h3
              style={{
                fontSize: '2.4rem',
                fontWeight: 'normal',
                fontFamily: 'serif, Georgia',
                color: '#ffffff',
                margin: '0 0 16px 0',
                lineHeight: '1.3',
              }}
            >
              Better yet, see us in person!
            </h3>

            <p
              style={{
                color: '#94a3b8',
                fontSize: '1.2rem',
                margin: '0 0 32px 0',
                fontFamily: 'serif, Georgia',
                lineHeight: '1.6',
              }}
            >
              We love our customers, so feel free to visit during normal business hours.
            </p>

            <a
              href="https://wa.me/918128461857"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 28px',
                backgroundColor: '#3b4758',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '1.15rem',
                marginBottom: '40px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>💬</span> Message us on WhatsApp
            </a>

            <div style={{ marginBottom: '32px' }}>
              <h4
                style={{
                  color: '#ffffff',
                  marginBottom: '10px',
                  fontSize: '1.5rem',
                  fontFamily: 'serif, Georgia',
                  fontWeight: 'normal',
                }}
              >
                Local Service Provider
              </h4>
              <p style={{ color: '#94a3b8', margin: '4px 0', fontSize: '1.15rem', fontFamily: 'serif, Georgia' }}>
                Email: Kumpatimahesh68@gmail.com
              </p>
              <p style={{ color: '#94a3b8', margin: '4px 0', fontSize: '1.15rem', fontFamily: 'serif, Georgia' }}>
                Mobile: +91 9381227456
              </p>
            </div>

            <div>
              <h4
                style={{
                  color: '#ffffff',
                  marginBottom: '10px',
                  fontSize: '1.5rem',
                  fontFamily: 'serif, Georgia',
                  fontWeight: 'normal',
                }}
              >
                Hours
              </h4>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.15rem', fontFamily: 'serif, Georgia' }}>
                Open today 08:00 am – 09:00 pm ∨
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: Laptop Image */}
          <div style={{ flex: '1', minWidth: '380px', textAlign: 'right' }}>
            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #1e293b',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                display: 'inline-block',
                width: '100%',
                maxWidth: '650px',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=80"
                alt="Contact local service provider"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>

        {/* Full-Width Footer Bar */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '60px',
            paddingTop: '25px',
            borderTop: '1px solid #1a2234',
            color: '#64748b',
            fontSize: '1rem',
            width: '100%',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2rem', color: '#cbd5e0', fontFamily: 'serif, Georgia' }}>
            Local service provider
          </p>
          <p style={{ marginTop: '8px' }}>
            Copyright © 2026 Local service provider - All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;