import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const CATEGORY_MAP = [
  { id: 1, name: 'Plumbing' },
  { id: 2, name: 'Electrical' },
  { id: 3, name: 'Cleaning' },
  { id: 4, name: 'AC Repair' },
  { id: 5, name: 'Automotive' },
  { id: 6, name: 'Painting' },
  { id: 7, name: 'Appliance Repair' },
  { id: 8, name: 'General' },
];

const CreateService = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    categoryId: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'categoryId' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const selectedCategoryObj = CATEGORY_MAP.find((c) => c.id === Number(formData.categoryId));

      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.location,
        categoryId: Number(formData.categoryId),
        category: selectedCategoryObj?.name || 'General',
      };

      await API.post('/services', payload);

      setSuccess('Service created successfully!');
      setTimeout(() => {
        navigate('/provider-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Create service error:', err);

      // Safe error parsing to prevent React crash
      const resData = err.response?.data;
      let displayError = 'Failed to create service. Please check input values.';

      if (typeof resData === 'string') {
        displayError = resData;
      } else if (resData?.errors && typeof resData.errors === 'object') {
        displayError = Object.values(resData.errors).join(', ');
      } else if (resData?.message) {
        displayError = resData.message;
      }

      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-service-wrapper">
      <style>{`
        .create-service-wrapper {
          max-width: 680px;
          margin: 0 auto;
          color: #0f172a;
          padding: 10px 0 30px 0;
        }

        .create-header {
          margin-bottom: 24px;
        }

        .create-header h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
        }

        .create-header p {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }

        .create-service-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 32px 36px;
          box-shadow: 0 4px 15px -3px rgba(15, 23, 42, 0.05);
        }

        .form-group-block {
          margin-bottom: 20px;
        }

        .form-group-block label {
          display: block;
          font-size: 0.86rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 8px;
        }

        .form-input-styled {
          width: 100%;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 0.92rem;
          color: #0f172a !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          font-family: inherit;
        }

        .form-input-styled:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .form-input-styled:-webkit-autofill,
        .form-input-styled:-webkit-autofill:hover,
        .form-input-styled:-webkit-autofill:focus,
        .form-input-styled:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 40px #ffffff inset !important;
          -webkit-text-fill-color: #0f172a !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        textarea.form-input-styled {
          resize: vertical;
          min-height: 100px;
        }

        .form-row-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .btn-create-submit {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 13px;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.15s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn-create-submit:hover {
          background: #1d4ed8;
        }

        .btn-create-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          margin-bottom: 20px;
        }

        .form-alert.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .form-alert.success {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
      `}</style>

      <div className="create-header">
        <h1>Add New Service</h1>
        <p>List a new service offering for customers to discover and book</p>
      </div>

      <div className="create-service-card">
        {error && <div className="form-alert error">{error}</div>}
        {success && <div className="form-alert success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group-block">
            <label>Service Title</label>
            <input
              type="text"
              name="title"
              className="form-input-styled"
              placeholder="e.g. Master Plumbing & Leak Repair"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group-block">
            <label>Service Category</label>
            <select
              name="categoryId"
              className="form-input-styled"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              {CATEGORY_MAP.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row-2col">
            <div className="form-group-block">
              <label>Starting Price (₹)</label>
              <input
                type="number"
                name="price"
                step="any"
                min="1"
                className="form-input-styled"
                placeholder="e.g. 499"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group-block">
              <label>Location / City</label>
              <input
                type="text"
                name="location"
                className="form-input-styled"
                placeholder="e.g. Kurnool, Hyderabad"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group-block">
            <label>Description</label>
            <textarea
              name="description"
              className="form-input-styled"
              placeholder="Describe your service, what's included, and expected timeframe..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-create-submit"
            disabled={loading}
          >
            {loading ? 'Creating Service...' : 'Publish Service →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateService;