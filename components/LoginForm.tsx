
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface LoginFormProps {
  role: UserRole;
  onLogin: (param1: string, param2: string, param3: string | UserRole, param4?: UserRole) => void;
  error: string | null; // Still received to know if App has an error, but not displayed here
  clearError: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ role, onLogin, error, clearError }) => {
  const [identifier, setIdentifier] = useState(''); // Used for UserID (Admin/Manager) or ShalarthID (Teacher)
  const [mobileNumber, setMobileNumber] = useState(''); // Specific to Teacher login
  const [password, setPassword] = useState('');

  useEffect(() => {
    setIdentifier('');
    setMobileNumber('');
    setPassword('');
    clearError(); // Clears error state in App.tsx when role changes
  }, [role, clearError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear previous errors in App.tsx before new attempt
    if (role === UserRole.Teacher) {
      onLogin(identifier, mobileNumber, password, role); // identifier is Shalarth ID here
    } else {
      onLogin(identifier, password, role); // identifier is User ID here
    }
  };

  const roleName = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold text-center text-slate-200 mb-6">{roleName} Login</h2>
      
      {role === UserRole.Teacher ? (
        <>
          <div>
            <label htmlFor="shalarthId" className="block text-sm font-medium text-slate-300">
              Shalarth ID
            </label>
            <input
              type="text"
              id="shalarthId"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
              placeholder="Enter Shalarth ID"
            />
          </div>
          <div>
            <label htmlFor="mobileNumber" className="block text-sm font-medium text-slate-300">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobileNumber"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
              pattern="\d{10}"
              title="Mobile number must be 10 digits"
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
              placeholder="Enter 10-digit Mobile Number"
            />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-slate-300">
            User ID
          </label>
          <input
            type="text"
            id="userId"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
            placeholder={`Enter ${roleName} User ID`}
          />
        </div>
      )}
      
      <div>
        <label htmlFor="password"className="block text-sm font-medium text-slate-300">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-slate-100"
          placeholder="Enter Password"
        />
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors duration-150"
      >
        Login
      </button>
      {role === UserRole.Admin && (
        <p className="mt-4 text-xs text-center text-slate-400">
          To get the Admin login ID and Password please mail your Full Name, Taluka, District, Mobile Number and e-mail Id to <a href="mailto:contact.mahalaxmi9@gmail.com" className="text-red-500 font-bold text-lg hover:text-red-400 underline">contact.mahalaxmi9@gmail.com</a>
        </p>
      )}
    </form>
  );
};

export default LoginForm;
