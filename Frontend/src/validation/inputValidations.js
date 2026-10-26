/**
 * Input validations and handlers for Phone, Pincode, Email, etc.
 */

/**
 * Validates a 10-digit Indian/standard phone number
 * @param {string} phone
 * @returns {{ isValid: boolean, error: string }}
 */
export function validatePhone(phone) {
  const value = String(phone || '').trim();
  if (!value) {
    return { isValid: false, error: 'Phone number is required.' };
  }
  if (!/^\d+$/.test(value)) {
    return { isValid: false, error: 'Phone number must contain only digits.' };
  }
  if (value.length !== 10) {
    return { isValid: false, error: 'Phone number must be exactly 10 digits.' };
  }
  return { isValid: true, error: '' };
}

/**
 * Validates a 6-digit postal pincode
 * @param {string} pincode
 * @returns {{ isValid: boolean, error: string }}
 */
export function validatePincode(pincode) {
  const value = String(pincode || '').trim();
  if (!value) {
    return { isValid: false, error: 'Pincode is required.' };
  }
  if (!/^\d+$/.test(value)) {
    return { isValid: false, error: 'Pincode must contain only digits.' };
  }
  if (value.length !== 6) {
    return { isValid: false, error: 'Pincode must be exactly 6 digits.' };
  }
  return { isValid: true, error: '' };
}

/**
 * Validates an email address format
 * @param {string} email
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEmail(email) {
  const value = String(email || '').trim();
  if (!value) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(value)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }
  return { isValid: true, error: '' };
}

/**
 * Validates hospital form inputs before submission
 * @param {Object} form
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateHospitalForm(form) {
  const errors = {};

  if (!form.name || !form.name.trim()) {
    errors.name = 'Hospital Name is required.';
  }

  if (!form.type || !form.type.trim()) {
    errors.type = 'Hospital Type is required.';
  }

  if (!form.address || !form.address.trim()) {
    errors.address = 'Address is required.';
  }

  const phoneCheck = validatePhone(form.phone);
  if (!phoneCheck.isValid) {
    errors.phone = phoneCheck.error;
  }

  const pincodeCheck = validatePincode(form.pincode);
  if (!pincodeCheck.isValid) {
    errors.pincode = pincodeCheck.error;
  }

  const emailCheck = validateEmail(form.email);
  if (!emailCheck.isValid) {
    errors.email = emailCheck.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Input typing handlers that restrict characters while typing
 */
export const inputHandlers = {
  /**
   * Allows only digits, max 10 characters
   */
  phone: (e, callback) => {
    const raw = e?.target?.value ?? e ?? '';
    const digitsOnly = String(raw).replace(/\D/g, '').slice(0, 10);
    if (typeof callback === 'function') {
      callback(digitsOnly);
    }
    return digitsOnly;
  },

  /**
   * Allows only digits, max 6 characters
   */
  pincode: (e, callback) => {
    const raw = e?.target?.value ?? e ?? '';
    const digitsOnly = String(raw).replace(/\D/g, '').slice(0, 6);
    if (typeof callback === 'function') {
      callback(digitsOnly);
    }
    return digitsOnly;
  },

  /**
   * Allows only characters permissible in an email address while typing
   */
  email: (e, callback) => {
    const raw = e?.target?.value ?? e ?? '';
    // Allow characters while typing: letters, numbers, @, ., _, -, +
    const filtered = String(raw).replace(/[^a-zA-Z0-9@._+-]/g, '');
    if (typeof callback === 'function') {
      callback(filtered);
    }
    return filtered;
  },
};

export default {
  validatePhone,
  validatePincode,
  validateEmail,
  validateHospitalForm,
  inputHandlers,
};
