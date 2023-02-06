# idb-reactive

The IndexedDB development-experience enhanced package, based on package `idb-keyval` and `@vue/reactivity`.

---

## how to use?

### Install `idb-reactive`

```bash
npm install --save idb-reactive
# or
pnpm add idb-reactive
# or
yarn add idb-reactive
```

### Use `useStore` to get reactivity store object.

```typescript
import { useStore, utils } from "idb-reactive";

/**
 * if `settings` store has records:
 * - pageSize: 10
 * - currentIndex: 10
 */
const store = useStore("settings");
await utils.isReady(store);
console.log(store); // <-- { pageSize: 10, currentIndex: 10 }

// remove record.
delete store.pageSize;

// add or update record.
store.pageSize = 12;

// and you can use `computed` or `watch` on it.
const keys = computed(() => Object.keys(store));
console.log(keys.value); // <-- ["pageSize", "currentIndex"]
```

---

## API Document

- Create a reactivity object for `storeName`.
  ```ts
  function useStore(storeName = ""): Record<string, unknown>
  ```
  - update/create new
    ```ts
    const store = useStore();
    await utils.isReady(store);
    // if `newRecord` is not exists, it will be saved.
    // if `newRecord` was exists, it will be updated.
    store.newRecord = 10;
    ```
  - delete record
    ```ts
    delete store.newRecord;
    ```
- Create a ref target for `key` in [`storeName`] store.\
  If you just want to create a binding for single key, this is well solution.
  ```ts
  function useKeyval<Key extends IDBValidKey, Value>(key: Key, defaultValue?: Value, storeName = ""): Ref<Value>
  ```
  - update/create new
    ```ts
    const newRecord = useKeyval("new record", 10, "temp");
    ```
  - delete record
    ```ts
    // @ts-ignore
    newRecord.value = undefined;
    // the ts-ignore was not required, you can use like this:
    const newRecord = useKeyval<number | undefined>("new record", 10, "temp");
    await utils.isReady(newRecord);
    newRecord.value = undefined;
    ```
- Create a `idb-keyval` wrapper with `storeName`.\
  ```ts
  function createStore<Key extends IDBValidKey, Value>(storeName = ""): {
    /**
     * get
     * getMany
     * set
     * setMany
     * ...and other function like module `idb-keyval` has but without parameter `store`.
     */
  }
  ```
- `Utils`
  ```ts
  import { utils } from "idb-reactive"
  ```
  - Check an object's state.\
    The `obj` can be `useStore`'s result, or `useKeyval`'s result.\
    The result will be resolved when `obj` loaded.
    ```ts
    function isReady(obj: object): Promise<boolean>
    ```

---

## Other

### With rxjs

If you want to used with `rxjs`, you can use `@vueuse/rxjs`, just like this:

```ts
import { useStore, utils } from "idb-reactive";
import { from } from "@vueuse/rxjs";

const store = useStore();
await utils.isReady(store);
// convert `reactive` object to rxjs's Observable.
const observable = from(store, { deep: true });
observable.subscribe((val) => console.log("store changed, new val:", val));
```
