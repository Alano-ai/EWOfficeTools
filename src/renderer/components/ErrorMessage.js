import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '15px', 
      backgroundColor: 'var(--error-bg)', 
      borderRadius: '8px',
      border: '1px solid #feb2b2'
    }}>
      <p style={{ color: 'var(--error-color)', textAlign: 'center' }}>
        {message}
      </p>
    </div>
  );
};

export default ErrorMessage;
