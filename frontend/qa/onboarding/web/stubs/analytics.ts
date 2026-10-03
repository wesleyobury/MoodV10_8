const log = (name: string, meta?: any) => { const w: any = window; (w.__events = w.__events || []).push({ name, meta }); };
export const trackEvent = async (_t: any, name: string, meta?: any) => log(name, meta);
export const trackGuestEvent = async (name: string, meta?: any) => log(name, meta);
export const Analytics: any = new Proxy({}, { get: (_o, k: string) => (_t: any, meta?: any) => log(String(k), meta) });
