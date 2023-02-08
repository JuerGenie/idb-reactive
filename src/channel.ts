const channelCache: Record<string, BroadcastChannel> = {};

export function getChannel(storeName = "") {
  return (channelCache[storeName] ??= new BroadcastChannel(storeName));
}
