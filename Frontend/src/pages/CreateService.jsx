import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const CreateService = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '', // 📍 Added Location Field
    categoryId: '1' // Defaulting to Category ID 1 (e.g., Home Services / General)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST request including location and categoryId
      await API.post('/services', {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.location, // 📍 Included location in request payload
        categoryId: parseInt(formData.categoryId, 10)
      });

      // Redirect back to services list after creation
      navigate('/services');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
      <h2>Add New Service</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Service Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Price (₹)</label>
          <input
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        {/* 📍 Added Location Input Field */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Location / City</label>
          <input
            type="text"
            name="location"
            placeholder="e.g. Vijayawada, Hyderabad"
            value={formData.location}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Category ID</label>
          <input
            type="number"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Creating...' : 'Create Service'}
        </button>
      </form>
    </div>
  );
};

export default CreateService;