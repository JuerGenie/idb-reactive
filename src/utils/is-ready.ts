const readyMap = new WeakMap<object, Promise<boolean>>();

export function isReady(obj: object) {
  return readyMap.get(obj);
}

export function register<T extends object>(obj: T) {
  let ready: (value: boolean) => void;
  readyMap.set(obj, new Promise((resolve) => (ready = resolve)));

  return {
    result: obj,
    ready: ready!,
  };
}
