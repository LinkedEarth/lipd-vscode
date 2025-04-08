declare module 'zustand' {
  type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => void;
  type GetState<T> = () => T;
  type StoreApi<T> = {
    setState: SetState<T>;
    getState: GetState<T>;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
    destroy: () => void;
  };

  export default function create<TState>(
    createState: (set: SetState<TState>, get: GetState<TState>, api: StoreApi<TState>) => TState
  ): StoreApi<TState> & {
    <U>(selector: (state: TState) => U): U;
  };
} 