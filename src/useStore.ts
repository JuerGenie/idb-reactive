import { computed, reactive, watch } from "@vue/runtime-core";
import { createStore } from "./createStore.js";
import { isReady, register } from "./utils/is-ready.js";

const storeCache: Record<string, UseStoreResult> = {};
type UseStoreResult = Record<string, unknown>;

export function useStore(storeName = "") {
  if (!storeCache[storeName]) {
    const { result, ready } = register(reactive<UseStoreResult>({}));

    const store = createStore(storeName);

    store
      // 从store中拿到所有的key
      .keys<string>()
      // 遍历拿到的所有key，并使用useKeyval进行包裹
      .then((keys) =>
        Promise.all(
          keys.map((key) => isReady((result[key] = store.useKeyval(key))))
        )
      )
      .then(() => {
        const keys = computed(() => Object.keys(result));
        watch(keys, (nv, ov) => {
          nv.filter((key) => !ov.includes(key)).forEach((key) => {
            result[key] = store.useKeyval(key, result[key]);
          });
          store.delMany(ov.filter((key) => !nv.includes(key)));
        });

        ready(true);
      });

    storeCache[storeName] = result;
  }

  return storeCache[storeName];
}
