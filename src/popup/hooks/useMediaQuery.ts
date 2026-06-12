import { useEffect, useState } from 'react';

/**
 * Bir CSS media query'sini React state'i olarak izler. Yan panel kendi
 * viewport'una sahip olduğu için `(min-width: …)` panel genişliğini yansıtır;
 * kullanıcı paneli sürükleyince değer güncellenir.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler(); // mount anındaki değerle senkronla
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
