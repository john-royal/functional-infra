import { AsyncLocalStorage } from "node:async_hooks";

export function createContext<T>() {
  const storage = new AsyncLocalStorage<T>();
  return {
    use() {
      return storage.getStore();
    },
    require() {
      const result = storage.getStore();
      if (!result) {
        throw new Error("No context available");
      }
      return result;
    },
    provide: storage.run.bind(storage),
  };
}
