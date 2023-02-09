import { createStore, Store } from "./createStore.js";
import { ref, toRaw, Ref } from "@vue/runtime-core";
import { register } from "./utils/is-ready.js";
import debounce from "lodash/debounce";
import { WatchPausableReturn, watchPausable } from "@vueuse/shared";
import { emit as rawEmit } from "./channel.js";

const StoreGetSymbol = Symbol("store.get");
const StoreSetSymbol = Symbol("store.set");
const StoreWatcherSymbol = Symbol("store.watcher");

type KeyvalRef<T = any> = Ref<T> & {
  [StoreGetSymbol]: () => Promise<void>;
  [StoreSetSymbol]: (value: T) => Promise<void>;
  [StoreWatcherSymbol]: WatchPausableReturn;
};

// 存放store的缓存，避免重复创建多个store对象。
const storeCache: Record<string, Store> = {};
// 存放ref的缓存，key 为 `${storeName}:${key}`。
const keyvalCache: Record<`${string}:${string}`, KeyvalRef<any>> = {};

export function pauseWatch(keyval: Ref<unknown>) {
  (keyval as KeyvalRef)[StoreWatcherSymbol]?.pause();
}
export function resumeWatch(keyval: Ref<unknown>) {
  (keyval as KeyvalRef)[StoreWatcherSymbol]?.resume();
}
export function stopWatch(keyval: Ref<unknown>) {
  (keyval as KeyvalRef)[StoreWatcherSymbol]?.stop();
}
export async function update(keyval: Ref<unknown>) {
  await (keyval as KeyvalRef)[StoreGetSymbol]?.();
}

export interface UseKeyvalOptions {
  autoSynchronize?: boolean;
}

export function useKeyval<Value>(
  key: IDBValidKey,
  defaultValue?: Value,
  storeName = "",
  { autoSynchronize = true }: UseKeyvalOptions = {}
): Ref<Value> {
  return (keyvalCache[`${storeName}:${key}`] ??= (() => {
    // 根据传入的storeName判断是否应该获取store对象，idb-keyval有默认的store，因此store不是必须的。
    // 尝试获取缓存中的store对象，如果没有缓存，则向缓存中存入一个新创建的对象。
    const store = (storeCache[storeName] ??= createStore(storeName));
    const emit = autoSynchronize
      ? rawEmit.bind(undefined, storeName)
      : () => {};

    const { result, ready } = register(
      ref<Value>(defaultValue!) as KeyvalRef<Value>
    );

    (result[StoreGetSymbol] = async function get() {
      const res = await store.get(key);
      // 如果取出的值为undefined，意味着该key未初始化，将默认值写入数据库。
      if (res === undefined || res === null) {
        await store.set(key, toRaw(result.value));
        emit("create", key);
      }
      // 否则将取出的值置入ref中。
      else {
        result.value = res as typeof result["value"];
      }
    })()
      // get操作是异步的，返回值为一个Promise，使用.then来承接接下来的异步操作。
      .then(() => {
        // 当ref初始化完毕后，再监听ref的修改。
        const watcher = (result[StoreWatcherSymbol] = watchPausable(
          result,
          debounce(async (nv) => {
            // 如果新值为undefined，代表移除此key。
            if (nv === undefined) {
              await store.del(key);
              watcher.stop();
              delete keyvalCache[`${storeName}:${key}`];
              emit("remove", key);
            }
            // 否则写入数据库。
            else {
              await store.set(key, toRaw(nv));
              emit("update", key);
            }
          }, 100),
          {
            deep: true,
            // 使用 sync 模式来进行监听，发生改变时立刻同步操作
            flush: "sync",
          }
        ));

        ready(true);
      });

    return result;
  })());
}
