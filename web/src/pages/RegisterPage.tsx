import { Link } from 'react-router-dom';
import './RegisterPage.css'; // Создадим этот файл для стилей

export function RegisterPage() {
  return (
    <div className="register-container">
      <h2>Choose Your Role</h2>
      <p>How would you like to use our service?</p>
      <div className="role-selection">
        <Link to="/register/client" className="role-card">
          <h3>Register as a Client</h3>
          <p>I need help with repairing my appliances.</p>
        </Link>
        <Link to="/register/master" className="role-card">
          <h3>Register as a Master</h3>
          <p>I am a professional who can offer repair services.</p>
        </Link>
      </div>
    </div>
  );
}
