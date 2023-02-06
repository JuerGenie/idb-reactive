import { createStore, Store } from "./createStore.js";
import { ref, watch, toRaw } from "@vue/runtime-core";
import { register } from "./utils/is-ready.js";
import debounce from "lodash/debounce";

// 存放store的缓存，避免重复创建多个store对象。
const storeCache: Record<string, Store> = {};

export function useKeyval<Value>(
  key: IDBValidKey,
  defaultValue?: Value,
  storeName = ""
) {
  // 根据传入的storeName判断是否应该获取store对象，idb-keyval有默认的store，因此store不是必须的。
  // 尝试获取缓存中的store对象，如果没有缓存，则向缓存中存入一个新创建的对象。
  const store = (storeCache[storeName] ??= createStore(storeName));

  const { result, ready } = register(ref<Value>(defaultValue!));
  store
    .get(key)
    // get操作是异步的，返回值为一个Promise，使用.then来承接接下来的异步操作。
    .then((res) => {
      // 如果取出的值为undefined，意味着该key未初始化，将默认值写入数据库。
      if (res === undefined || res === null) {
        store.set(key, toRaw(result.value));
      }
      // 否则将取出的值置入ref中。
      else {
        result.value = res as typeof result["value"];
      }

      // 当ref初始化完毕后，再监听ref的修改。
      const cancelWatch = watch(
        result,
        debounce((nv) => {
          // 如果新值为undefined，代表移除此key。
          if (nv === undefined) {
            store.del(key);
            cancelWatch();
          }
          // 否则写入数据库。
          else {
            store.set(key, toRaw(nv));
          }
        }, 100),
        {
          deep: true,
          // 使用 sync 模式来进行监听，发生改变时立刻同步操作
          flush: "sync",
        }
      );

      ready(true);
    });

  return result;
}
