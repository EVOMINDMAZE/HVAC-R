import { supabase } from '@/lib/supabase';

export function useConsent() {
  const hasConsent = () => {
    if (typeof window === 'undefined') return false;
    const given = localStorage.getItem('consent_given');
    return given === 'true';
  };

  const getConsentVersion = (type: string, version: string) => {
    if (typeof window === 'undefined') return false;
    const key = `consent_${type}_${version}`;
    const value = localStorage.getItem(key);
    return value === 'true';
  };

  const recordConsent = async (type: string, version: string, granted: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`consent_${type}_${version}`, granted.toString());
    localStorage.setItem('consent_given', 'true');
    localStorage.setItem('consent_timestamp', new Date().toISOString());

    // Sync to backend if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        await fetch('/api/privacy/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            consent_type: type,
            consent_version: version,
            granted,
          }),
        });
      } catch (error) {
        console.error('Failed to sync consent to backend:', error);
      }
    }
  };

  return {
    hasConsent,
    getConsentVersion,
    recordConsent,
  };
}