export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates a name field (first name or last name)
 * @param name - The name to validate
 * @returns ValidationResult object with isValid boolean and message string
 */
export const validateName = (name: string): ValidationResult => {
  // Remove leading/trailing whitespace
  const trimmedName = name.trim();

  // Check if name is empty
  if (!trimmedName) {
    return {
      isValid: false,
      message: 'Name is required',
    };
  }

  // Check minimum length
  if (trimmedName.length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters long',
    };
  }

  // Check maximum length
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      message: 'Name must not exceed 50 characters',
    };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return {
      isValid: false,
      message:
        'Name can only contain letters, spaces, hyphens, and apostrophes',
    };
  }

  // Check for consecutive spaces
  if (/\s{2,}/.test(trimmedName)) {
    return {
      isValid: false,
      message: 'Name cannot contain consecutive spaces',
    };
  }

  return {
    isValid: true,
    message: 'Valid name',
  };
};

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns ValidationResult object with isValid boolean and message string
 */
export const validateEmail = (email: string): ValidationResult => {
  // Remove leading/trailing whitespace
  const trimmedEmail = email.trim();

  // Check if email is empty
  if (!trimmedEmail) {
    return {
      isValid: false,
      message: 'Email is required',
    };
  }

  // Check maximum length
  if (trimmedEmail.length > 254) {
    return {
      isValid: false,
      message: 'Email address is too long',
    };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }

  // More comprehensive email validation
  const comprehensiveEmailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!comprehensiveEmailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Email format is invalid',
    };
  }

  // Check for valid domain part
  const [localPart, domainPart] = trimmedEmail.split('@');

  // Local part validation
  if (localPart.length > 64) {
    return {
      isValid: false,
      message: 'Email local part is too long',
    };
  }

  // Domain part validation
  if (domainPart.length > 253) {
    return {
      isValid: false,
      message: 'Email domain is too long',
    };
  }

  // Check for consecutive dots
  if (/\.{2,}/.test(trimmedEmail)) {
    return {
      isValid: false,
      message: 'Email cannot contain consecutive dots',
    };
  }

  // Check if starts or ends with dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      message: 'Email local part cannot start or end with a dot',
    };
  }

  return {
    isValid: true,
    message: 'Valid email address',
  };
};

/**
 * Validates a password
 * @param password - The password to validate
 * @returns ValidationResult object with isValid boolean and message string
 */
export const validatePassword = (password: string): ValidationResult => {
  // Check if password is empty
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required',
    };
  }

  // Check minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }

  // Check maximum length
  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must not exceed 128 characters',
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter',
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    };
  }

  // Check for common weak patterns
  const weakPatterns = [
    /(.)\1{2,}/, // Three or more consecutive identical characters
    /123456/, // Sequential numbers
    /abcdef/, // Sequential letters
    /qwerty/i, // Common keyboard patterns
    /password/i, // Contains "password"
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return {
        isValid: false,
        message: 'Password contains common weak patterns',
      };
    }
  }

  return {
    isValid: true,
    message: 'Strong password',
  };
};

/**
 * Validates if two passwords match
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns ValidationResult object with isValid boolean and message string
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match',
    };
  }

  return {
    isValid: true,
    message: 'Passwords match',
  };
};

/**
 * Validate a username
 * @param username - The username to validate
 * @returns ValidationResult object with isValid boolean and message string
 */
export const validateUsername = (username: string): ValidationResult => {
  // Remove leading/trailing whitespace
  const trimmedUsername = username.trim();

  // Check if username is empty
  if (!trimmedUsername) {
    return {
      isValid: false,
      message: 'Username is required',
    };
  }

  // Check minimum length
  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      message: 'Username must be at least 3 characters long',
    };
  }

  // Check maximum length
  if (trimmedUsername.length > 30) {
    return {
      isValid: false,
      message: 'Username must not exceed 30 characters',
    };
  }

  // Check for valid characters (alphanumeric, underscores, hyphens)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmedUsername)) {
    return {
      isValid: false,
      message:
        'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return {
    isValid: true,
    message: 'Valid username',
  };
};
