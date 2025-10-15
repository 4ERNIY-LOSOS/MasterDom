import React, { useState } from 'react';

export function RegisterClientPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Registering...');

    try {
      const response = await fetch('/api/auth/register/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to register');
      }

      setMessage(`Client registered successfully! User ID: ${data.userId}`);
      setFormData({ firstName: '', lastName: '', phoneNumber: '', email: '', password: '' });

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2>Register as a Client</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required minLength={8} />
        <button type="submit">Register</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
