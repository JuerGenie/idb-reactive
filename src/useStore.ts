import { computed, reactive, Ref, toRaw } from "@vue/runtime-core";
import { watchPausable, WatchPausableReturn } from "@vueuse/shared";
import { on as rawOn } from "./channel.js";
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
  let watcher: WatchPausableReturn;

  if (!storeCache[storeName]) {
    const { result, ready } = register(reactive<UseStoreResult>({}));

    const store = createStore(storeName);
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
            store.delMany(
              ov
                .filter((key) => !nv.includes(key))
                .map((key) => ((store.useKeyval(key).value = undefined), key))
            );
          },
          { flush: "sync", deep: true }
        );

        ready(true);
      });

    const cache: UseStoreCache = {
      store: result,
      channel: undefined,
    };

    if (autoSynchronize) {
      const on = rawOn.bind(undefined, storeName);

      on(
        "create",
        pauseAndDo((key) => {
          watcher.pause();
          result[key] = store.useKeyval(key, undefined, {
            autoSynchronize,
          });
          watcher.resume;
        })
      );
      on(
        "update",
        pauseAndDo(async (key) => {
          const target = toRaw(result)[key] as Ref<unknown>;
          if (target) {
            pauseWatch(target);
            await update(target);
            resumeWatch(target);
          }
        })
      );
      on(
        "remove",
        pauseAndDo((key) => {
          delete result[key];
        })
      );
    }

    storeCache[storeName] = cache;
  }

  return storeCache[storeName].store;

  function pauseAndDo<F extends Function>(func: F): F {
    return (async (...args: any[]) => {
      try {
        watcher.pause();
        return await func(...args);
      } finally {
        watcher.resume();
      }
    }) as any;
  }
}
