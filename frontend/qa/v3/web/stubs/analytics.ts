export const trackEvent = async (_t: string, name: string, meta?: any) => { (window as any).__events = (window as any).__events || []; (window as any).__events.push({ name, meta }); };
