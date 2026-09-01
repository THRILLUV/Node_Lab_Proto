export function createTrack(layer, gtag) {
  const queue = layer || [];
  return function track(name, params = {}) {
    queue.push({ event: name, ...params, t: Date.now() });
    if (gtag) gtag("event", name, params);
    return queue;
  };
}
