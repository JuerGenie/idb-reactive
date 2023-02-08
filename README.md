# idb-reactive

The IndexedDB development-experience enhanced package, based on package `idb-keyval` and `@vue/runtime-core`.

Reactivity object, and auto cross document synchronize.

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

- `useStore`: Create a reactivity object for `storeName`.
  
  Parameters:
  | Parameter | Type                            | require | Description                                                                                                                                                        |
  | :-------- | ------------------------------- | ------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | storeName | `string \| undefined`           | No      | store's name, default is "".                                                                                                                                       |
  | options   | `{ autoSynchronize?: boolean }` | No      | `autoSynchronize`: default is `true`, that means enable auto cross document synchronize, when you update store's value, it will change other document's value too. |

  Result:
  ```ts
  type UseStoreResult = Record<string, unknown>;
  ```
  - use case:
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
- `useKeyval`: Create a ref target for `key` in [`storeName`] store. If you just want to create a binding for single key, this is well solution.

  Parameters:
  | Parameter    | Type                            | require                                                                  | Description                                                                                                                                                      |
  | :----------- | ------------------------------- | ------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | key          | `string`                        | Yes                                                                      | the key that `Ref` will binding.                                                                                                                                 |
  | defaultValue | `Value \| undefined`            | the default value to use to initialize record that if key is not exists. |
  | storeName    | `string \| undefined`           | No                                                                       | store's name, default is "".                                                                                                                                     |
  | options      | `{ autoSynchronize?: boolean }` | No                                                                       | `autoSynchronize`: default is `true`, that means enable auto cross document synchronize, when you update ref's value, it will change other document's value too. |

  Result:
  ```ts
  type UseKeyvalResult = Ref<Value>;
  ```
  - use case:
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
- `createStore`: Create a `idb-keyval` wrapper with `storeName`.

  Parameters:
  | Parameter | Type                  | require | Description                  |
  | :-------- | --------------------- | ------- | :--------------------------- |
  | storeName | `string \| undefined` | No      | store's name, default is "". |

  Result:
  ```ts
  type CreateStoreResult = {
    clear: () => Promise<void>;
    del: <Key extends IDBValidKey>(key: Key) => Promise<void>;
    delMany: <Key extends IDBValidKey>(keys: Key[]) => Promise<void>;
    entries: <Key extends IDBValidKey, Value>() => Promise<[Key, Value][]>;
    get: <Key extends IDBValidKey, Value>(key: Key) => Promise<Value | undefined>;
    getMany: <Key extends IDBValidKey, Value>(keys: Key[]) => Promise<Value[]>;
    keys: <Key extends IDBValidKey>() => Promise<Key[]>;
    set: <Key extends IDBValidKey, Value>(key: Key, value: Value) => Promise<void>;
    setMany: <Key extends IDBValidKey, Value>(entries: [Key, Value][]) => Promise<void>;
    update: <Key extends IDBValidKey, Value>(key: Key, updater: (value?: Value | undefined) => Value) => Promise<void>;
    values: <Value>() => Promise<Value[]>,

    useKeyval: <Key extends IDBValidKey, Value>(key: Key, defaultValue?: Value | undefined, options?: UseKeyvalOptions) => Ref<Value>;
  }
  ```
- `Utils`
  ```ts
  import { utils } from "idb-reactive"
  ```
  - `isReady`: Check an object's state.

    Parameters:
    | Parameter | Type     | require | Description                                          |
    | :-------- | -------- | ------- | :--------------------------------------------------- |
    | obj       | `object` | Yes     | can be `useStore`'s result, or `useKeyval`'s result. |

    Result:
    ```ts
    // will be resolved when `obj` loaded.
    type IsReadyResult = Promise<boolean>;
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
