// TODO: this signature could be customized and we could maybe merge TsBase and TsCustom.
// Anything that has a Symbol.iterator method is an iterable.
type Iterable<T> = { [Symbol.iterator]: () => IteratorObject<T, undefined, T>; length?: number; size?: number };

// Predicate is a function that takes a value and returns a boolean.
type Predicate<T> = (value: T) => boolean;

// Transformer is a function that takes a value and returns a new value.
type Transformer<T, K> = (value: T) => K;

// Transformer is a function that takes a value and returns a new value.
type ConditionTransformer<T, K> = (value: T) => Option<K>;

// Reducer is a function that takes an accumulator and a value and returns a new accumulator.
type Reducer<A, T> = (accumulator: A, value: T) => A;

// ConditionalReducer is a function that takes an accumulator and a value and returns a new accumulator.
type ConditionalReducer<A, T> = (accumulator: A, value: T) => Option<A>;

// DeepReadonly is a type that makes all properties of an object readonly.
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// TODO: do we use option? or something more js-like? Some notion of Result is very useful here though.
abstract class Option<T> {
  abstract isSome(): boolean;
  abstract isNone(): boolean;
  abstract unwrap(): T;
  abstract unwrapOrElse(f: () => T): T;
  abstract map<K>(transformer: Transformer<T, K>): Option<K>;
}

export class Some<T> extends Option<T> {
  constructor(public value: T) {
    super();
  }

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOrElse(_: () => T): T {
    return this.value;
  }

  map<K>(transformer: Transformer<T, K>): Option<K> {
    return new Some(transformer(this.value));
  }
}

export class None<T> extends Option<T> {
  constructor() {
    super();
  }

  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  unwrap(): T {
    throw new Error('Cannot unwrap None');
  }

  unwrapOrElse(f: () => T): T {
    return f();
  }

  map<K>(_: Transformer<T, K>): Option<K> {
    return new None();
  }
}

abstract class TsIterator<T> {
  // TODO:
  // forEach
  // flatMap, flatten - requires recursive iters
  // unzip - requires us to check that T is a tuple
  // zip, unzip, enumerate, cycle, takeWhile, skipWhile, skip, take, chain??
  // next, next_back, rev? - double-ended iterator
  // chunk.

  constructor(private _len: Option<number>) {
    //
  }

  abstract next(): Option<T>;

  find(predicate: Predicate<T>): Option<T> {
    let current = this.next();

    while (current.isSome()) {
      if (predicate(current.unwrap())) {
        return current;
      }

      current = this.next();
    }

    return current;
  }

  findMap<K>(transformer: ConditionTransformer<T, K>): Option<K> {
    let current = this.next();

    while (current.isSome()) {
      const transformed = transformer(current.unwrap());

      if (transformed.isSome()) {
        return transformed;
      }

      current = this.next();
    }

    return new None();
  }

  fold<A>(initial: A, reducer: Reducer<A, T>): A {
    let current = this.next();
    let accumulator = initial;

    while (current.isSome()) {
      accumulator = reducer(accumulator, current.unwrap());

      current = this.next();
    }

    return accumulator;
  }

  tryFold<A>(initial: A, reducer: ConditionalReducer<A, T>): Option<A> {
    let current = this.next();
    let accumulator = initial;

    while (current.isSome()) {
      const result = reducer(accumulator, current.unwrap());

      if (result.isNone()) {
        return new None();
      }

      accumulator = result.unwrap();

      current = this.next();
    }

    return new Some(accumulator);
  }

  forEach(f: (value: T) => void): void {
    this.fold(undefined, (_, value) => {
      f(value);
      return undefined;
    });
  }

  all(predicate: Predicate<T>): boolean {
    return this.tryFold(true, (acc, value) => {
      if (!predicate(value)) {
        return new None();
      }

      return new Some(acc);
    }).isSome();
  }

  any(predicate: Predicate<T>): boolean {
    return this.tryFold(false, (acc, value) => {
      if (predicate(value)) {
        return new None();
      }

      return new Some(acc);
    }).isNone();
  }

  // Sugar to be more js-like.
  reduce<A>(initial: A, reducer: Reducer<A, T>): A {
    return this.fold(initial, reducer);
  }

  // Same here.
  tryReduce<A>(initial: A, reducer: ConditionalReducer<A, T>): Option<A> {
    return this.tryFold(initial, reducer);
  }

  len(): Option<number> {
    return this._len;
  }

  count(): number {
    return this._len.unwrapOrElse(() => this.fold(0, (acc, _) => acc + 1));
  }

  // TODO: is collect<T>() possible?
  collectArray(): T[] {
    const result: T[] = [];

    let current = this.next();

    while (current.isSome()) {
      result.push(current.unwrap());

      current = this.next();
    }

    return result;
  }

  filter(predicate: Predicate<T>): TsIterator<T> {
    return new TsFilter(this, predicate);
  }

  map<K>(transformer: Transformer<T, K>): TsIterator<K> {
    return new TsMap(this, transformer);
  }

  filterMap<K>(transformer: ConditionTransformer<T, K>): TsIterator<K> {
    return new TsFilterMap(this, transformer);
  }

  zip<K>(other: Iterable<K> | TsIterator<K>): TsIterator<[T, K]> {
    const isIterable = (other: Iterable<K> | TsIterator<K>): other is Iterable<K> => {
      return (other as Iterable<K>)[Symbol.iterator] !== undefined;
    };

    return isIterable(other) ? new TsZip(this, new TsBase(other)) : new TsZip(this, other);
  }
}

export class TsBase<T> extends TsIterator<T> {
  private iterator: Iterator<T>;

  constructor(iterable: Iterable<T>) {
    // Cache the length if it's available.
    const hasLen = iterable.length ?? iterable.size;

    super(hasLen ? new Some(hasLen) : new None());

    this.iterator = iterable[Symbol.iterator]();
  }

  next() {
    const next = this.iterator.next();

    return next.done ? new None<T>() : new Some(next.value);
  }
}

export class TsCustom<T> extends TsIterator<T> {
  private curr: Option<T>;

  constructor(curr: T, private _next: (curr: T) => Option<T>) {
    // Custom iterator does not know the length.
    super(new None());

    this.curr = new Some(curr);
  }

  next() {
    const curr = this.curr;

    if (curr.isSome()) {
      this.curr = this._next(curr.unwrap());
    }

    return curr;
  }
}

export class TsFilter<T> extends TsIterator<T> {
  constructor(private iterable: TsIterator<T>, private predicate: Predicate<T>) {
    // Filter map can change number of elements.
    super(new None());
  }

  next() {
    return this.iterable.find(this.predicate);
  }
}

export class TsMap<T, K> extends TsIterator<K> {
  constructor(private iterable: TsIterator<T>, private transformer: Transformer<T, K>) {
    // Map does not change number of elements.
    super(iterable.len());
  }

  next() {
    return this.iterable.next().map(this.transformer);
  }
}

export class TsFilterMap<T, K> extends TsIterator<K> {
  constructor(private iterable: TsIterator<T>, private transformer: ConditionTransformer<T, K>) {
    // Filter map can change number of elements.
    super(new None());
  }

  next() {
    return this.iterable.findMap(this.transformer);
  }
}

export class TsZip<T, K> extends TsIterator<[T, K]> {
  constructor(private one: TsIterator<T>, private other: TsIterator<K>) {
    // We do not know the resulting length of zip.
    super(new None());
  }

  next() {
    const next1 = this.one.next();
    const next2 = this.other.next();

    if (next1.isNone() || next2.isNone()) {
      return new None<[T, K]>();
    }

    return new Some<[T, K]>([next1.unwrap(), next2.unwrap()]);
  }
}

// Sugar for creating a new TsIterator.
export const iter = <T>(iterable: Iterable<DeepReadonly<T>>) => {
  return new TsBase(iterable);
};

export const custom_iter = <T>(initial: T, next: (prev: T) => Option<T>) => {
  return new TsCustom<T>(initial, next);
};

// TODO:
// double-ended iterator
// exact size iterator - probably redundant as all js stuff has .size or .length

// iterators per primitive? like .sum on numbers.

// IDEAS:
// I don't even know if it's relevant but - async support?
