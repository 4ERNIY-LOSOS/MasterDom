import React, { useState } from 'react';

export function RegisterMasterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    bio: '',
    yearsOfExperience: 0,
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'yearsOfExperience' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Registering...');

    try {
      const response = await fetch('/api/auth/register/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to register');
      }

      setMessage(`Master registered successfully! User ID: ${data.userId}`);
      setFormData({ firstName: '', lastName: '', phoneNumber: '', email: '', password: '', bio: '', yearsOfExperience: 0 });

    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="form-container">
      <h2>Register as a Master</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" />
        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required minLength={8} />
        <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself and your skills" />
        <input type="number" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} placeholder="Years of Experience" />
        <button type="submit">Register</button>
      </form>
      {message && <p className="form-message">{message}</p>}
    </div>
  );
}
