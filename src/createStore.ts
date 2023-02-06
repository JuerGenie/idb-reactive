import * as keyval from "idb-keyval";
import { useKeyval } from "./useKeyval";

export function createStore(storeName: string) {
  const store = keyval.createStore(storeName, storeName);

  return {
    clear: () => keyval.clear(store),
    del: <Key extends IDBValidKey>(key: Key) => keyval.del(key, store),
    delMany: <Key extends IDBValidKey>(keys: Key[]) =>
      keyval.delMany(keys, store),
    entries: <Key extends IDBValidKey, Value>() =>
      keyval.entries<Key, Value>(store),
    get: <Key extends IDBValidKey, Value>(key: Key) =>
      keyval.get<Value>(key, store),
    getMany: <Key extends IDBValidKey, Value>(keys: Key[]) =>
      keyval.getMany<Value>(keys, store),
    keys: <Key extends IDBValidKey>() => keyval.keys<Key>(store),
    set: <Key extends IDBValidKey, Value>(key: Key, value: Value) =>
      keyval.set(key, value, store),
    setMany: <Key extends IDBValidKey, Value>(entries: [Key, Value][]) =>
      keyval.setMany(entries, store),
    update: <Key extends IDBValidKey, Value>(
      key: Key,
      updater: (value?: Value) => Value
    ) => keyval.update(key, updater, store),
    values: <Value>() => keyval.values<Value>(store),

    useKeyval: <Key extends IDBValidKey, Value>(
      key: Key,
      defaultValue?: Value
    ) => useKeyval(key, defaultValue, storeName),
  };
}

export type Store = ReturnType<typeof createStore>;
