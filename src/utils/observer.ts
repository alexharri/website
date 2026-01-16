type Listener<T> = (value: T) => void;

export class Observer<T> {
  private listeners: { id: number; callback: Listener<T> }[] = [];
  private counter = 0;

  constructor(private value: T) {}

  getValue() {
    return this.value;
  }

  subscribe(callback: Listener<T>): () => void {
    const id = this.counter++;
    const { listeners } = this;
    listeners.push({ id, callback });
    return function unsubscribe() {
      for (let i = 0; i < listeners.length; i++) {
        if (listeners[i].id === id) {
          listeners.splice(i, 1);
          i--;
        }
      }
    };
  }

  emit(value: T) {
    this.value = value;
    for (const { callback } of this.listeners) {
      callback(this.value);
    }
  }
}
