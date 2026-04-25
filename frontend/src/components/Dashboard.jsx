import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Plus, Upload, LogOut, Edit2, Search } from 'lucide-react';
import ExcelUpload from './ExcelUpload';

const Dashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(sessionStorage.getItem('dashboardSearch') || '');
  const [page, setPage] = useState(parseInt(sessionStorage.getItem('dashboardPage')) || 0);
  const [totalPages, setTotalPages] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('dashboardSearch', searchQuery);
    sessionStorage.setItem('dashboardPage', page);
  }, [searchQuery, page]);

  const fetchCustomers = async () => {
    try {
      if (searchQuery.trim()) {
        const response = await api.get(`/customers/search?query=${searchQuery}`);
        setCustomers(response.data);
        setTotalPages(1); 
      } else {
        const response = await api.get(`/customers?page=${page}&size=10`);
        setCustomers(response.data.content);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching customers', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ padding: '1.5rem', width: '96%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--primary-color)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem', lineHeight: 1 }}>C</span>
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: 0, lineHeight: '1.1' }}>CustomerDesk</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Empowering your business with seamless customer management</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={() => setShowUploadModal(true)}>
            <Upload size={18} /> Bulk Upload
          </button>
          <button className="btn-primary" onClick={() => navigate('/customer/new')}>
            <Plus size={18} /> Add Customer
          </button>
          <button className="btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by name or NIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              paddingLeft: '2.5rem',
              width: '100%',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        </div>
      </div>

      <div className="glass-card table-container">
        <table>
          <thead>
            <tr>
              <th>NIC</th>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Mobile Numbers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.nic}</td>
                <td>{customer.name}</td>
                <td>{customer.dob}</td>
                <td>
                  {customer.mobileNumbers && customer.mobileNumbers.length > 0
                    ? customer.mobileNumbers.map(m => m.mobileNumber).join(', ')
                    : 'N/A'}
                </td>
                <td>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '0.5rem' }}
                    onClick={() => navigate(`/customer/${customer.id}`)}
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', padding: '1rem' }}>
            <button 
              className="btn-secondary" 
              disabled={page === 0} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              Page {page + 1} of {totalPages}
            </span>
            <button 
              className="btn-secondary" 
              disabled={page === totalPages - 1} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showUploadModal && (
        <ExcelUpload 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => {
            setShowUploadModal(false);
            fetchCustomers();
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
