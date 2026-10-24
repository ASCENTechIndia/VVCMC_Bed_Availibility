const IP_CACHE_KEY = 'vvcmc_device_ip';
const MAC_CACHE_KEY = 'vvcmc_device_mac';

export async function getIpAddress() {
  try {
    const cached = sessionStorage.getItem(IP_CACHE_KEY);
    if (cached) return cached;
  } catch (error) {
    console.warn('Error reading IP from sessionStorage:', error);
  }

  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data?.ip || null;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`Error fetching IP from ${url}:`, error.message || error);
    }
    return null;
  };

  try {
    const ip =
      (await fetchWithTimeout('https://api.ipify.org?format=json')) ||
      (await fetchWithTimeout('https://api64.ipify.org?format=json'));

    if (ip) {
      try {
        sessionStorage.setItem(IP_CACHE_KEY, ip);
      } catch (error) {
        console.warn('Error saving IP to sessionStorage:', error);
      }
      return ip;
    }
  } catch (error) {
    console.error('Error resolving device IP address:', error);
  }

  return import.meta.env.VITE_DEFAULT_IP || '12.13.33';
}

export function getMacAddress() {
  try {
    const cached = localStorage.getItem(MAC_CACHE_KEY);
    if (cached) return cached;
  } catch (error) {
    console.warn('Error reading MAC from localStorage:', error);
  }

  if (import.meta.env.VITE_DEFAULT_MAC) {
    return import.meta.env.VITE_DEFAULT_MAC;
  }

  const nav = typeof window !== 'undefined' ? window.navigator : {};
  const screen = typeof window !== 'undefined' ? window.screen : {};
  const fingerprint = [
    nav.userAgent || '',
    nav.language || '',
    screen.colorDepth || '',
    screen.width || '',
    screen.height || '',
    nav.hardwareConcurrency || '',
  ].join('###');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = (hash << 5) - hash + fingerprint.charCodeAt(i);
    hash |= 0;
  }

  const hex = Math.abs(hash).toString(16).padStart(12, '0').slice(0, 12);
  const parts = hex.match(/.{1,2}/g) || ['12', '13', '33', '44', '55', '66'];
  const mac = parts.join(':').toUpperCase();

  try {
    localStorage.setItem(MAC_CACHE_KEY, mac);
  } catch (error) {
    console.warn('Error saving MAC to localStorage:', error);
  }

  return mac;
}

export function getSource() {
  return import.meta.env.VITE_API_SOURCE || 'RW';
}

export function getHostname() {
  return (
    import.meta.env.VITE_API_HOSTNAME ||
    (typeof window !== 'undefined' ? window.location.host : 'localhost:5000') ||
    'localhost:5000'
  );
}
