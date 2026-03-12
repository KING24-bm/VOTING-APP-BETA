export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

export const validatePollData = (data: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  options: string[];
  maxVotes: number;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.title.trim()) {
    errors.push('Title is required');
  } else if (data.title.length > 255) {
    errors.push('Title must be less than 255 characters');
  }

  if (data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  }

  if (!data.endDate) {
    errors.push('End date is required');
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (start >= end) {
      errors.push('End date must be after start date');
    }
    
    if (new Date() > end) {
      errors.push('End date cannot be in the past');
    }
  }

  const validOptions = data.options.filter(opt => opt.trim() !== '');
  if (validOptions.length < 2) {
    errors.push('At least 2 valid options are required');
  }

  if (data.maxVotes < 1 || data.maxVotes > validOptions.length) {
    errors.push(`Max votes must be between 1 and ${validOptions.length}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

