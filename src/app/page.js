'use client';

import React, { useEffect, useState, useMemo } from 'react';
import PasswordStrengthMeter from './component/PasswordStrengthMeter';

export default function Page() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    profilePhoto: null,
    username: '',
    usernameAvailable: null,
    currentPassword: '',
    newPassword: '',
    gender: '',
    customGender: '',
    dob: '',
    profession: '',
    company: '',
    addressLine1: '',
    country: '',
    state: '',
    city: '',
    subscription: 'Basic',
    newsletter: true,
  });

  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [touched, setTouched] = useState({
    username: false,
    gender: false,
    dob: false,
    // Add other fields as needed
  });

  const previewUrl = useMemo(() => {
    if (!formData.profilePhoto) return null;
    return URL.createObjectURL(formData.profilePhoto);
  }, [formData.profilePhoto]);

  useEffect(() => {
    fetch('/api/country')
      .then(res => res.json())
      .then(data => setCountries(data));
  }, []);

  useEffect(() => {
    if (formData.country) {
      setFormData(prev => ({ ...prev, state: '', city: '' }));
      fetch(`/api/country/${formData.country}/states`)
        .then(res => res.json())
        .then(data => setStates(data));
    }
  }, [formData.country]);

  useEffect(() => {
    if (formData.state) {
      setFormData(prev => ({ ...prev, city: '' }));
      fetch(`/api/country/${formData.country}/states/${formData.state}/cities`)
        .then(res => res.json())
        .then(data => setCities(data));
    }
  }, [formData.state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username.length >= 4) {
        fetch(`/api/user/check-username?username=${formData.username}`)
          .then(res => res.json())
          .then(data => setFormData(prev => ({ ...prev, usernameAvailable: data.available })))
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username]);

const HandleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    
    // Mark field as touched when it changes
    if (!touched[name]) {
      setTouched(prev => ({ ...prev, [name]: true }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isValid = ['image/jpeg', 'image/png'].includes(file.type) && file.size <= 2 * 1024 * 1024;
    if (isValid) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      if (errors.profilePhoto) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.profilePhoto;
          return newErrors;
        });
      }
    } else {
      alert('Only JPG/PNG files under 2MB are allowed');
      setErrors(prev => ({ ...prev, profilePhoto: 'Invalid file format or size' }));
    }
  };

  const validateStep = (stepToValidate) => {
    const newErrors = {};

    if (stepToValidate === 1) {
      if (!formData.profilePhoto) newErrors.profilePhoto = 'Profile photo is required';
      if (!formData.username) newErrors.username = 'Username is required';
      else if (formData.username.length < 4 || formData.username.length > 20 || /\s/.test(formData.username)) newErrors.username = 'Username must be 4-20 characters without spaces';
      else if (formData.usernameAvailable === false) newErrors.username = 'Username is already taken';
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (formData.gender === 'Other' && !formData.customGender) newErrors.customGender = 'Please specify your gender';
      if (!formData.dob) newErrors.dob = 'Date of birth is required';
    }

    if (stepToValidate === 2) {
      if (formData.newPassword) {
        if (!formData.currentPassword) newErrors.currentPassword = 'Current password required to change password';
        const passwordErrors = validatePassword(formData.newPassword);
        if (passwordErrors.length > 0) newErrors.newPassword = passwordErrors.join(', ');
      }
    }

    if (stepToValidate === 3) {
      if (!formData.profession) newErrors.profession = 'Profession is required';
      if (formData.profession === 'Entrepreneur' && !formData.company) newErrors.company = 'Company name is required';
      if (!formData.addressLine1) newErrors.addressLine1 = 'Address Line 1 is required';
      if (!formData.country) newErrors.country = 'Country is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.city) newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStepChange = (direction) => {
    if (direction === 'next') {
      const isValid = validateStep(step);
      if (isValid) {
        setStep(prev => prev + 1);
      } else {
        // Scroll to the first error
        const firstError = Object.keys(errors)[0];
        if (firstError) {
          document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    } else if (direction === 'back') {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all steps before submission
    let allValid = true;
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        allValid = false;
        break;
      }
    }

    if (!allValid) {
      alert('Please fix all errors before submitting');
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    try {
      const res = await fetch('/api/user/submit', { method: 'POST', body: data });
      const result = await res.json();
      if (result.success) {
        alert('Profile submitted successfully');
      } else {
        alert('Submission failed');
      }
    } catch (err) {
      console.error('Error submitting profile:', err);
      alert('Something went wrong');
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('Min 8 characters');
    if (!/[0-9]/.test(password)) errors.push('Must include number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Must include special character');
    return errors;
  };

  const today = new Date().toISOString().split('T')[0];


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile Setup</h1>
            <div className="flex items-center space-x-2">
             {[1, 2, 3, 4].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <button
                    onClick={() => {
                      if (stepNumber < step) {
                        setStep(stepNumber);
                      } else {
                        // Validate current step before allowing to jump ahead
                        if (validateStep(step)) {
                          setStep(stepNumber);
                        }
                      }
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${step === stepNumber ? 'bg-blue-600 text-black' : step > stepNumber ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {stepNumber}
                  </button>
                  {stepNumber < 4 && (
                    <div className={`w-6 h-1 ${step > stepNumber ? 'bg-green-100' : 'bg-gray-200'}`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-black p-2 rounded-full cursor-pointer shadow-md transform group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="relative">
                        <input
                          name="username"
                          value={formData.username}
                          onChange={HandleChange}
                          className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your username"
                        />
                        {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                        {formData.usernameAvailable === false && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {formData.usernameAvailable === true && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {formData.usernameAvailable === false && (
                        <p className="mt-1 text-sm text-red-600">Username is already taken</p>
                      )}
                      {formData.usernameAvailable === true && (
                        <p className="mt-1 text-sm text-green-600">Username is available</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={HandleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {formData.gender === 'Other' && (
                      <input
                        name="customGender"
                        value={formData.customGender}
                        onChange={HandleChange}
                        placeholder="Please specify"
                        className="w-full px-4 py-2 mt-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                    {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      max={today}
                      value={formData.dob}
                      onChange={HandleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 text-black focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.dob && <p className="text-sm text-red-500">{errors.dob}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Security</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={HandleChange}
                      className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter current password"
                    />
                    {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={HandleChange}
                      className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Create new password"
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">{errors.newPassword}</p>
                    )}
                    {formData.newPassword && (
                      <div className="mt-3 space-y-2">
                        <PasswordStrengthMeter password={formData.newPassword} />
                        <ul className="text-sm text-gray-600 space-y-1 mt-2">
                          {validatePassword(formData.newPassword).map((err, i) => (
                            <li key={i} className="flex items-center">
                              <svg
                                className={`h-4 w-4 mr-2 ${formData.newPassword.length >= 8 && /[0-9]/.test(formData.newPassword) && /[!@#$%^&*]/.test(formData.newPassword) ? 'text-green-500' : 'text-red-500'}`}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {err}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Professional Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                    <select
                      name="profession"
                      value={formData.profession}
                      onChange={HandleChange}
                      className="w-full px-4 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Profession</option>
                      <option value="Student">Student</option>
                      <option value="Developer">Developer</option>
                      <option value="Entrepreneur">Entrepreneur</option>
                    </select>
                    {errors.profession && <p className="text-sm text-red-500">{errors.profession}</p>}
                  </div>
                  {formData.profession === 'Entrepreneur' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        name="company"
                        value={formData.company}
                        onChange={HandleChange}
                        className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter company name"
                      />
                      {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={HandleChange}
                      className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street address"
                    />
                    {errors.addressLine1 && <p className="text-sm text-red-500">{errors.addressLine1}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={HandleChange}
                        className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Country</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.country && <p className="text-sm text-red-500">{errors.country}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={HandleChange}
                        className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!formData.country}
                      >
                        <option value="">Select State</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={HandleChange}
                        className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={!formData.state}
                      >
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Subscription Plan</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Basic', 'Pro', 'Enterprise'].map(plan => (
                        <label
                          key={plan}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.subscription === plan ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="subscription"
                              value={plan}
                              checked={formData.subscription === plan}
                              onChange={HandleChange}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />

                            <span className="ml-3 font-medium text-gray-700">{plan}</span>
                            {errors.subscription && (
                              <p className="text-sm text-red-500 ml-2">{errors.subscription}</p>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            {plan === 'Basic' && 'Free access to basic features'}
                            {plan === 'Pro' && 'Advanced features and analytics'}
                            {plan === 'Enterprise' && 'Custom solutions for businesses'}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <label className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          name="newsletter"
                          checked={formData.newsletter}
                          onChange={HandleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        {errors.newsletter && <p className="text-sm text-red-500 ml-2">{errors.newsletter}</p>}
                      </div>
                      <div className="ml-3 text-sm">
                        <span className="font-medium text-gray-700">Subscribe to newsletter</span>
                        <p className="text-gray-500">Get the latest updates and news</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-200">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => handleStepChange('back')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => handleStepChange('next')}
                  className="px-6 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-black rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Complete Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}