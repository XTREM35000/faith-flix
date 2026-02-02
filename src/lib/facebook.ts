export function canCallFB() {
  return typeof FB !== 'undefined' && (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname.startsWith('127.')
  );
}

export function safeGetLoginStatus() {
  try {
    if (canCallFB()) {
      FB.getLoginStatus((response: any) => {
        console.log('safeGetLoginStatus:', response?.status);
      });
      return true;
    }
    if (typeof FB !== 'undefined') {
      console.warn('Facebook SDK present but page not secure; skipping getLoginStatus');
    }
  } catch (e) {
    console.warn('safeGetLoginStatus error:', e);
  }
  return false;
}
