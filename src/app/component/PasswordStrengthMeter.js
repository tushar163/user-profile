'use client';

import React from 'react';

export default function PasswordStrengthMeter({ password }) {
  const calculateStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    return strength;
  };

  const strength = calculateStrength(password);
  
  const getColor = () => {
    switch (strength) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-red-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getLabel = () => {
    switch (strength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getLabelColor = () => {
    switch (strength) {
      case 0: return 'text-red-600';
      case 1: return 'text-red-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-blue-600';
      case 4: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRequirements = () => {
    const requirements = [
      { label: '8+ characters', met: password.length >= 8 },
      { label: '1+ special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
      { label: '1+ number', met: /[0-9]/.test(password) },
      { label: '1+ uppercase letter', met: /[A-Z]/.test(password) },
    ];

    return requirements;
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Password strength</span>
        <span className={`text-sm font-semibold ${getLabelColor()}`}>{getLabel()}</span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} rounded-full transition-all duration-500 ease-out`} 
          style={{ 
            width: `${(strength / 4) * 100}%`,
            transitionProperty: 'width, background-color'
          }} 
        />
      </div>
      
      <ul className="grid grid-cols-2 gap-1 mt-2">
        {getRequirements().map((req, index) => (
          <li key={index} className="flex items-center">
            <span className={`inline-flex items-center justify-center w-4 h-4 mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`}>
              {req.met ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={`text-xs ${req.met ? 'text-gray-600' : 'text-gray-400'}`}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}