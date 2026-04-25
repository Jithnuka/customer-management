import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { ArrowLeft, Plus, Trash2, Save, Search, UserPlus, X } from 'lucide-react';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    dob: '',
    dob: '',
    mobileNumbers: [{ countryCode: '', localNumber: '' }],
    addresses: [{ addressLine1: '', addressLine2: '', cityName: '', countryName: '' }],
    familyMembers: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const init = async () => {
      const loadedCountries = await fetchCountries();
      if (isEditMode) {
        fetchCustomer(loadedCountries);
      }
    };
    init();
  }, [id]);

  const fetchCountries = async () => {
    try {
      const response = await api.get('/countries');
      setCountries(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch countries', err);
      return [];
    }
  };

  const fetchCustomer = async (loadedCountries = countries) => {
    try {
      const response = await api.get(`/customers/${id}`);
      const data = response.data;

      // Split combined mobile numbers for the UI
      if (data.mobileNumbers && data.mobileNumbers.length > 0) {
        data.mobileNumbers = data.mobileNumbers.map(m => {
          const combined = m.mobileNumber;
          // Find matching country prefix using loadedCountries if available
          const listToSearch = loadedCountries.length > 0 ? loadedCountries : countries;
          const matchingCountry = listToSearch.find(c => combined.startsWith(c.phonePrefix));
          if (matchingCountry) {
            return {
              id: m.id,
              countryCode: matchingCountry.phonePrefix,
              localNumber: combined.substring(matchingCountry.phonePrefix.length)
            };
          }
          return { id: m.id, countryCode: '', localNumber: combined };
        });
      } else {
        data.mobileNumbers = [{ countryCode: '', localNumber: '' }];
      }

      if (!data.addresses || data.addresses.length === 0) data.addresses = [{ addressLine1: '', addressLine2: '', cityName: '', countryName: '' }];
      setFormData(data);
    } catch (err) {
      setError('Failed to fetch customer details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMobileChange = (index, field, value) => {
    const updatedMobiles = [...formData.mobileNumbers];
    updatedMobiles[index][field] = value;
    setFormData(prev => ({ ...prev, mobileNumbers: updatedMobiles }));
  };

  const addMobile = () => setFormData(prev => ({ ...prev, mobileNumbers: [...prev.mobileNumbers, { countryCode: '', localNumber: '' }] }));
  const removeMobile = (index) => {
    const updated = formData.mobileNumbers.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, mobileNumbers: updated.length ? updated : [{ countryCode: '', localNumber: '' }] }));
  };

  const handleAddressChange = (index, field, value) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses[index][field] = value;
    setFormData(prev => ({ ...prev, addresses: updatedAddresses }));
  };

  const addAddress = () => setFormData(prev => ({
    ...prev,
    addresses: [...prev.addresses, { addressLine1: '', addressLine2: '', cityName: '', countryName: '' }]
  }));
  const removeAddress = (index) => {
    const updated = formData.addresses.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, addresses: updated.length ? updated : [{ addressLine1: '', addressLine2: '', cityName: '', countryName: '' }] }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await api.get(`/customers/search?query=${searchQuery}`);
      // Filter out the current customer from results (can't link to self)
      const filteredResults = response.data.filter(c => c.id !== Number(id));
      setSearchResults(filteredResults);
    } catch (err) {
      console.error('Error searching customers', err);
    } finally {
      setIsSearching(false);
    }
  };

  const addFamilyMember = (customer) => {
    if (!formData.familyMembers.find(fm => fm.id === customer.id)) {
      setFormData(prev => ({
        ...prev,
        familyMembers: [...prev.familyMembers, customer]
      }));
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFamilyMember = (customerId) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter(fm => fm.id !== customerId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.nic.trim()) newErrors.nic = 'NIC is required';
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';

    formData.mobileNumbers.forEach((mobile, idx) => {
      if (!mobile.countryCode) newErrors[`mobileNumbers[${idx}].mobileNumber`] = 'Country code required';
      if (!/^[a-zA-Z0-9]{5,15}$/.test(mobile.localNumber)) newErrors[`mobileNumbers[${idx}].mobileNumber`] = 'Invalid number format';
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      setLoading(false);
      return;
    }

    // Clean up and combine mobile numbers
    const cleanedData = {
      ...formData,
      mobileNumbers: formData.mobileNumbers
        .filter(m => m.localNumber.trim() !== '')
        .map(m => ({
          id: m.id,
          mobileNumber: `${m.countryCode}${m.localNumber}`
        })),
      addresses: formData.addresses.filter(a => a.addressLine1.trim() !== '' && a.cityName.trim() !== '' && a.countryName.trim() !== '')
    };

    try {
      if (isEditMode) {
        await api.put(`/customers/${id}`, cleanedData);
      } else {
        await api.post('/customers', cleanedData);
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 400 && typeof err.response.data === 'object') {
        // Handle GlobalExceptionHandler validation errors
        setValidationErrors(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Error saving customer');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', width: '80%', margin: '0 auto' }}>
      <button
        className="btn-secondary"
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-card">
        <h2 style={{ marginBottom: '2rem' }}>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</h2>

        {error && <div className="error-message" style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ borderColor: validationErrors.name ? 'var(--error-color)' : 'var(--border-color)' }} />
              {validationErrors.name && <span style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>{validationErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>NIC Number *</label>
              <input type="text" name="nic" value={formData.nic} onChange={handleChange} required style={{ borderColor: validationErrors.nic ? 'var(--error-color)' : 'var(--border-color)' }} />
              {validationErrors.nic && <span style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>{validationErrors.nic}</span>}
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" name="dob" value={formData.dob} onChange={handleChange} required style={{ borderColor: validationErrors.dob ? 'var(--error-color)' : 'var(--border-color)' }} />
              {validationErrors.dob && <span style={{ color: 'var(--error-color)', fontSize: '0.875rem' }}>{validationErrors.dob}</span>}
            </div>
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Mobile Numbers</h3>
              <button type="button" className="btn-secondary" onClick={addMobile} style={{ padding: '0.5rem' }}>
                <Plus size={16} /> Add Mobile
              </button>
            </div>
            {formData.mobileNumbers.map((mobile, index) => (
              <div key={index} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <select
                    value={mobile.countryCode}
                    onChange={(e) => handleMobileChange(index, 'countryCode', e.target.value)}
                    style={{ width: '150px', borderColor: validationErrors[`mobileNumbers[${index}].mobileNumber`] ? 'var(--error-color)' : 'var(--border-color)' }}
                  >
                    <option value="">Code</option>
                    {countries.map(c => (
                      <option key={c.id} value={c.phonePrefix}>{c.phonePrefix} ({c.code})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={mobile.localNumber}
                    onChange={(e) => handleMobileChange(index, 'localNumber', e.target.value)}
                    placeholder="Enter mobile number"
                    style={{ flex: 1, borderColor: validationErrors[`mobileNumbers[${index}].mobileNumber`] ? 'var(--error-color)' : 'var(--border-color)' }}
                  />
                  <button type="button" className="btn-danger" onClick={() => removeMobile(index)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                {validationErrors[`mobileNumbers[${index}].mobileNumber`] && (
                  <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {validationErrors[`mobileNumbers[${index}].mobileNumber`]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3>Addresses</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginTop: '0.2rem' }}>
                  <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Tip:</span> For best consistency, remove an old address and add a new one if you need to change the city or country.
                </p>
              </div>
              <button type="button" className="btn-secondary" onClick={addAddress} style={{ padding: '0.5rem' }}>
                <Plus size={16} /> Add Address
              </button>
            </div>
            {formData.addresses.map((address, index) => (
              <div key={index} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', position: 'relative' }}>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removeAddress(index)}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem' }}
                >
                  <Trash2 size={16} />
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginRight: '3rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Address Line 1 *</label>
                    <input type="text" value={address.addressLine1} onChange={(e) => handleAddressChange(index, 'addressLine1', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Address Line 2</label>
                    <input type="text" value={address.addressLine2} onChange={(e) => handleAddressChange(index, 'addressLine2', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>City *</label>
                    <input type="text" value={address.cityName} onChange={(e) => handleAddressChange(index, 'cityName', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Country *</label>
                    <input type="text" value={address.countryName} onChange={(e) => handleAddressChange(index, 'countryName', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isEditMode && (
            <div style={{ marginTop: '2rem', marginBottom: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3>Link Family Members</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Search for existing customers by Name or NIC to link them as family members.</p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name or NIC..."
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                />
                <button type="button" className="btn-secondary" onClick={handleSearch} disabled={isSearching}>
                  <Search size={18} /> {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#f9fafb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Search Results</h4>
                    <button type="button" onClick={() => setSearchResults([])} style={{ color: 'var(--text-secondary)' }}>
                      <X size={18} />
                    </button>
                  </div>
                  {searchResults.map(customer => (
                    <div key={customer.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>{customer.name}</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>({customer.nic})</span>
                      </div>
                      <button type="button" className="btn-secondary" onClick={() => addFamilyMember(customer)} style={{ padding: '0.25rem 0.75rem' }}>
                        <UserPlus size={16} /> Link
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.familyMembers.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Linked Family Members</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {formData.familyMembers.map(fm => (
                      <div key={fm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <strong>{fm.name}</strong>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{fm.nic}</div>
                        </div>
                        <button type="button" className="btn-danger" onClick={() => removeFamilyMember(fm.id)} style={{ padding: '0.5rem' }}>
                          Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;