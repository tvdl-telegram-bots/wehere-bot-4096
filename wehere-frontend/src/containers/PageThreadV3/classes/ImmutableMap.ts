export class ImmutableMap<K, V> {
  private m0: Map<K, V>; // the big one
  private m1: Map<K, V>; // the small one

  constructor() {
    this.m0 = new Map();
    this.m1 = new Map();
  }

  has(key: K): boolean {
    return this.m1.has(key) || this.m0.has(key);
  }

  get(key: K): V | undefined {
    return this.m1.has(key) ? this.m1.get(key) : this.m0.get(key);
  }

  set(key: K, value: V): ImmutableMap<K, V> {
    if (this.m1.size ** 2 >= this.m0.size) {
      const result = new ImmutableMap<K, V>();
      result.m0 = new Map([
        ...Array.from(this.m0),
        ...Array.from(this.m1),
        [key, value],
      ]);
      return result;
    } else {
      const result = new ImmutableMap<K, V>();
      result.m0 = this.m0;
      result.m1 = new Map([...Array.from(this.m1), [key, value]]);
      return result;
    }
  }
}
