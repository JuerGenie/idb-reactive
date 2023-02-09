export type Events = "update" | "create" | "remove";

const channelCache: Record<string, BroadcastChannel> = {};

type StoreEventHandler = (key: string) => void | Promise<void>;
const channelEventListeners: Record<
  string,
  Record<Events, Set<StoreEventHandler>>
> = {};

function getListeners(storeName: string) {
  return (
    channel[storeName] &&
    (channelEventListeners[storeName] ??= {
      update: new Set(),
      create: new Set(),
      remove: new Set(),
    })
  );
}

export const channel = new Proxy(channelCache, {
  get(target, p: string) {
    return (target[p] ??= (() => {
      const result = new BroadcastChannel(p);
      result.addEventListener("message", async (evt) => {
        for (const listenrer of getListeners(p)[evt.data.type as Events]) {
          await listenrer(evt.data.key);
        }
      });

      return result;
    })());
  },
  deleteProperty(target, p: string) {
    target[p]?.close();
    return delete target[p];
  },
});

export function emit(store: string, type: Events, key: IDBValidKey) {
  channel[store].postMessage({ type, key });
}
export function on(store: string, type: Events, cb: StoreEventHandler) {
  getListeners(store)[type].add(cb);
}

export function getChannel(storeName = "") {
  return channel[storeName];
}
