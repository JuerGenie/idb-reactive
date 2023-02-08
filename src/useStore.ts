import { computed, reactive, Ref, toRaw } from "@vue/runtime-core";
import { watchPausable, WatchPausableReturn } from "@vueuse/shared";
import { getChannel } from "./channel.js";
import { createStore } from "./createStore.js";
import { pauseWatch, resumeWatch, update } from "./useKeyval.js";
import { isReady, register } from "./utils/is-ready.js";

const storeCache: Record<string, UseStoreCache> = {};
type UseStoreCache = { store: UseStoreResult; channel?: BroadcastChannel };
type UseStoreResult = Record<string, unknown>;

export interface UseStoreOptions {
  autoSynchronize?: boolean;
}

export function useStore(
  storeName = "",
  { autoSynchronize = true }: UseStoreOptions = {}
) {
  if (!storeCache[storeName]) {
    const { result, ready } = register(reactive<UseStoreResult>({}));

    const store = createStore(storeName);

    let watcher: WatchPausableReturn;
    store
      // 从store中拿到所有的key
      .keys<string>()
      // 遍历拿到的所有key，并使用useKeyval进行包裹
      .then((keys) =>
        Promise.all(
          keys.map((key) =>
            isReady(
              (result[key] = store.useKeyval(key, undefined, {
                autoSynchronize,
              }))
            )
          )
        )
      )
      .then(() => {
        const keys = computed(() => Object.keys(result));
        watcher = watchPausable(
          keys,
          (nv, ov) => {
            nv.filter((key) => !ov.includes(key)).forEach((key) => {
              result[key] = store.useKeyval(key, result[key], {
                autoSynchronize,
              });
            });
            store.delMany(ov.filter((key) => !nv.includes(key)));
          },
          { flush: "sync" }
        );

        ready(true);
      });

    const cache: UseStoreCache = {
      store: result,
      channel: undefined,
    };

    if (autoSynchronize) {
      cache.channel = getChannel(storeName);
      cache.channel.addEventListener("message", async (evt) => {
        watcher?.pause();
        switch (evt.data.type) {
          case "update": {
            const target = toRaw(result)[evt.data.key] as Ref<unknown>;
            if (target) {
              pauseWatch(target);
              await update(target);
              resumeWatch(target);
            }
            break;
          }
          case "create": {
            result[evt.data.key] = store.useKeyval(evt.data.key, undefined, {
              autoSynchronize,
            });
            break;
          }
          case "remove": {
            delete result[evt.data.key];
            break;
          }
        }
        watcher?.resume();
      });
    }

    storeCache[storeName] = cache;
  }

  return storeCache[storeName].store;
}
