import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateUsername,
} from '../../utils/validation';
import { registerUser } from '@/utils/api';
import useAuth from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: '',
  });
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { isLoading, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: '',
    };

    // Validate first name
    const firstNameResult = validateName(formData.firstName);
    if (!firstNameResult.isValid) {
      newErrors.firstName = firstNameResult.message;
    }

    // Validate last name
    const lastNameResult = validateName(formData.lastName);
    if (!lastNameResult.isValid) {
      newErrors.lastName = lastNameResult.message;
    }

    // Validate username
    const usernameResult = validateUsername(formData.username);
    if (!usernameResult.isValid) {
      newErrors.username = usernameResult.message;
    }

    // Validate email
    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) {
      newErrors.email = emailResult.message;
    }

    // Validate password
    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.isValid) {
      newErrors.password = passwordResult.message;
    }

    // Validate password match
    const passwordMatchResult = validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (!passwordMatchResult.isValid) {
      newErrors.confirmPassword = passwordMatchResult.message;
    }

    // Validate terms acceptance
    if (!acceptTerms) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);

    // Return true if no errors
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userDate = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };
      const response = await registerUser(userDate);

      if (response.success) {
        navigate('/auth/login');
      } else {
        // Handle registration error
        setErrors((prev) => ({
          ...prev,
          email: response.message || 'Registration failed',
        }));
      }
    } catch (error) {}
  };

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground">
            Join AI Schedule and manage your time efficiently
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="firstName"
                variant="name"
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                size="md"
              />
              <Input
                name="lastName"
                variant="name"
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                size="md"
              />
            </div>

            {/* Username Input */}
            <Input
              name="username"
              variant="default"
              label="Username"
              placeholder="john_doe"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              size="md"
            />

            {/* Email Input */}
            <Input
              name="email"
              variant="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              size="md"
            />

            {/* Password Input */}
            <Input
              name="password"
              variant="password"
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              size="md"
            />

            {/* Confirm Password Input */}
            <Input
              name="confirmPassword"
              variant="password"
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              size="md"
            />

            {/* Terms and Conditions */}
            <div className="space-y-2">
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: '' }));
                    }
                  }}
                  className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-input mt-1"
                />
                <label
                  htmlFor="acceptTerms"
                  className="ml-2 text-sm text-muted-foreground"
                >
                  I agree to the{' '}
                  <a
                    href="#"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="#"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-destructive text-sm">{errors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gradient"
              size="md"
              fullWidth={true}
              loading={loading}
              className="mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
