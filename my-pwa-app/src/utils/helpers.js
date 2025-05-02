/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Formats a date object or string to DD/MM/YYYY format
 * @param {Date|string} date - The date to format
 * @returns {string} - The formatted date string
 */
export const formatDate = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Parses a date string in DD/MM/YYYY format to a Date object
 * @param {string} dateString - The date string to parse
 * @returns {Date} - The parsed Date object
 */
export const parseDate = (dateString) => {
  const [day, month, year] = dateString.split('/');
  return new Date(`${year}-${month}-${day}`);
};

/**
 * Groups an array by a key selector function
 * @param {Array} array - The array to group
 * @param {Function} keySelector - Function that returns the key to group by
 * @returns {Object} - An object with keys from keySelector and arrays as values
 */
export const groupBy = (array, keySelector) => {
  return array.reduce((result, item) => {
    const key = keySelector(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {});
};

/**
 * Flattens a nested array structure
 * @param {Array} array - The array to flatten
 * @returns {Array} - The flattened array
 */
export const flatten = (array) => {
  return array.reduce(
    (result, item) => result.concat(Array.isArray(item) ? flatten(item) : item),
    []
  );
};

/**
 * Creates a memoized version of a function
 * @param {Function} fn - The function to memoize
 * @returns {Function} - The memoized function
 */
export const memoize = (fn) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Throttle function to ensure a function is called at most once in a specified time period
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Generates a unique ID
 * @returns {string} - A unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Deep clones an object
 * @param {Object} obj - The object to clone
 * @returns {Object} - The cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};