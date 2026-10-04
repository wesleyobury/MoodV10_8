import { useEffect } from 'react';
import { useCurrentRoute } from './router';
// Re-run on every navigation change (approximates focus for the mounted stack).
export const useFocusEffect = (cb: () => any) => { const r = useCurrentRoute(); useEffect(() => cb(), [cb, r, (window as any).__stack.length]); };
