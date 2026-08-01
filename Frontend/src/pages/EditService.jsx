import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';

const EditService = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    categoryId: '1'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch the existing service details by ID
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await API.get(`/services/${id}`);
        const data = response.data;
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price || '',
          categoryId: data.categoryId || '1'
        });
      } catch (err) {
        setError('Failed to fetch service details.');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Updated HTTP method from POST back to PUT to match @PutMapping("/{id}")
      await API.put(`/services/${id}`, {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId, 10)
      });

      navigate('/services');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update service.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '40px' }}>Loading service details...</p>;

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
      <h2>Edit Service</h2>
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
          <label style={{ display: 'block', marginBottom: '5px' }}>Price ($)</label>
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
          disabled={saving}
          style={{ padding: '10px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {saving ? 'Saving...' : 'Update Service'}
        </button>
      </form>
    </div>
  );
};

export default EditService;