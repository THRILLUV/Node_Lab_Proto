const queue = window.dataLayer || (window.dataLayer = []);

export function track(name, params = {}) {
  queue.push({ event: name, ...params, t: Date.now() });
  if (window.gtag) window.gtag("event", name, params);
}
