import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { X, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

const ExcelUpload = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/upload/customers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(response.data.message || 'File processed successfully!');
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload and process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}
        >
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud /> Bulk Upload Customers
        </h2>

        <div style={{ 
          border: '2px dashed var(--border-color)', 
          padding: '2rem', 
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          marginBottom: '1.5rem',
          backgroundColor: '#f9fafb'
        }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="excel-upload"
          />
          <label htmlFor="excel-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <UploadCloud size={48} color={file ? "var(--primary-color)" : "var(--text-secondary)"} />
            {file ? (
              <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>{file.name}</span>
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>Click to select Excel or CSV file</span>
            )}
          </label>
        </div>

        {error && (
          <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" onClick={handleUpload} disabled={!file || loading}>
            {loading ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelUpload;
