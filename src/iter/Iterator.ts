import { None, Some } from '../option/Option';
import type { Option } from '../option/Option';
import type {
  OptionReducer,
  OptionTransformer,
  Predicate,
  Reducer,
  Iterable,
  Transformer,
  NodeIterator,
} from '../types';

// TODO:
// flatMap, flatten - requires recursive iters
// unzip - requires us to check that T is a tuple
// enumerate, cycle, chain??
// next, next_back, rev? - double-ended iterator
// chunk.
// pop, push, shift, unshift - mutable iterator
//
// IDEAS:
// I don't even know if it's relevant but - async support?

export abstract class Iterator<T> {
  constructor(private _len: Option<number>) {
    //
  }

  /**
   * Get the next element in the iterator. This is the main method that needs to be implemented per iterator type.
   * For example Filter will find the next element that satisfies the predicate etc.
   */
  abstract next(): Option<T>;

  /**
   * Make the iterator iterable. Whoa.
   */
  *[Symbol.iterator](): Generator<T> {
    let current = this.next();

    while (current.isSome()) {
      yield current.unwrap();

      current = this.next();
    }
  }

  /**
   * Attempt to find the first element that satisfies the predicate.
   *
   * @param predicate The predicate to find the element.
   * @returns Some if element was found, None otherwise.
   */
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

  /**
   * Attempt to find the first element that satisfies the predicate and transform it.
   *
   * @param transformer The transformer to apply to the found element.
   * @returns Some if element was found, None otherwise.
   */
  findMap<K>(transformer: OptionTransformer<T, K>): Option<K> {
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

  /**
   * Fold the iterator into a single value.
   *
   * @param initial The initial value of the accumulator.
   * @param reducer The reducer function to apply to the accumulator and the current value.
   * @returns The final value of the accumulator.
   */
  fold<A>(initial: A, reducer: Reducer<A, T>): A {
    let current = this.next();
    let accumulator = initial;

    while (current.isSome()) {
      accumulator = reducer(accumulator, current.unwrap());

      current = this.next();
    }

    return accumulator;
  }

  /**
   * Fold the iterator into a single value, with the possibility of returning None.
   * If the reducer returns None, the iteration stops and None is returned.
   *
   * @param initial The initial value of the accumulator.
   * @param reducer The reducer function to apply to the accumulator and the current value.
   * @returns The final value of the accumulator, or None if the reducer returned None.
   */
  tryFold<A>(initial: A, reducer: OptionReducer<A, T>): Option<A> {
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

  /**
   * Apply a function to each element in the iterator.
   *
   * @param f The function to apply to each element.
   */
  forEach(f: (value: T) => void): void {
    this.fold(undefined, (_, value) => {
      f(value);
      return undefined;
    });
  }

  /**
   * Check if all elements in the iterator satisfy the predicate.
   *
   * @param predicate The predicate to check.
   * @returns True if all elements satisfy the predicate, false otherwise.
   */
  all(predicate: Predicate<T>): boolean {
    return this.tryFold(true, (acc, value) => {
      if (!predicate(value)) {
        return new None();
      }

      return new Some(acc);
    }).isSome();
  }

  /**
   * Check if any element in the iterator satisfies the predicate.
   *
   * @param predicate The predicate to check.
   * @returns True if any element satisfies the predicate, false otherwise.
   */
  any(predicate: Predicate<T>): boolean {
    return this.tryFold(false, (acc, value) => {
      if (predicate(value)) {
        return new None();
      }

      return new Some(acc);
    }).isNone();
  }

  /**
   * Reduce the iterator into a single value. Initial value is the first value in the iterator.
   *
   * @param reducer The reducer function to apply to the accumulator and the current value.
   * @returns The final value of the accumulator.
   */
  reduce(reducer: Reducer<Option<T>, T>): Option<T> {
    let initial = this.next();

    return this.fold(initial, reducer);
  }

  /**
   * Get the length of the iterator. This is an Option because the length might not be known.
   *
   * @returns The length of the iterator, or None if the length is unknown.
   */
  len(): Option<number> {
    return this._len;
  }

  /**
   * Count the number of elements in the iterator.
   *
   * @returns The number of elements in the iterator.
   */
  count(): number {
    return this._len.unwrapOrElse(() => this.fold(0, (acc, _) => acc + 1));
  }

  /**
   * Sugar for summing numbers in the iterator.
   *
   * @returns The sum of the numbers in the iterator.
   */
  sum(this: Iterator<number>) {
    return this.fold(0, (acc, x) => acc + x);
  }

  /**
   * Sugar for multiplying numbers in the iterator.
   *
   * @returns The product of the numbers in the iterator.
   */
  product(this: Iterator<number>) {
    return this.fold(1, (acc, x) => acc * x);
  }

  /**
   * Sugar for finding the minimum number in the iterator.
   *
   * @returns The minimum number in the iterator if attainable, None otherwise.
   */
  min(this: Iterator<number>) {
    return this.tryFold(Number.MAX_SAFE_INTEGER, (acc, x) => (x < acc ? new Some(x) : new Some(acc)));
  }

  /**
   * Sugar for finding the maximum number in the iterator.
   *
   * @returns The maximum number in the iterator if attainable, None otherwise.
   */
  max(this: Iterator<number>) {
    return this.tryFold(Number.MIN_SAFE_INTEGER, (acc, x) => (x > acc ? new Some(x) : new Some(acc)));
  }

  filter(predicate: Predicate<T>): Iterator<T> {
    return new Filter(this, predicate);
  }

  map<K>(transformer: Transformer<T, K>): Iterator<K> {
    return new Map(this, transformer);
  }

  filterMap<K>(transformer: OptionTransformer<T, K>): Iterator<K> {
    return new FilterMap(this, transformer);
  }

  skip(n: number): Iterator<T> {
    return new Skip(this, n);
  }

  skipWhile(predicate: Predicate<T>): Iterator<T> {
    return new SkipWhile(this, predicate);
  }

  take(n: number): Iterator<T> {
    return new Take(this, n);
  }

  takeWhile(predicate: Predicate<T>): Iterator<T> {
    return new TakeWhile(this, predicate);
  }

  zip<K>(other: Iterable<K> | Iterator<K>): Iterator<[T, K]> {
    const isIterable = (other: Iterable<K> | Iterator<K>): other is Iterable<K> => {
      return (other as Iterable<K>)[Symbol.iterator] !== undefined;
    };

    return isIterable(other) ? new Zip(this, new Base(other)) : new Zip(this, other);
  }
}

export class Base<T> extends Iterator<T> {
  private iterator: NodeIterator<T>;

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

export class Custom<T> extends Iterator<T> {
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

export class Filter<T> extends Iterator<T> {
  constructor(private iterator: Iterator<T>, private predicate: Predicate<T>) {
    // Filter map can change number of elements.
    super(new None());
  }

  next() {
    return this.iterator.find(this.predicate);
  }
}

export class Map<T, K> extends Iterator<K> {
  constructor(private iterator: Iterator<T>, private transformer: Transformer<T, K>) {
    // Map does not change number of elements.
    super(iterator.len());
  }

  next() {
    return this.iterator.next().map(this.transformer);
  }
}

export class FilterMap<T, K> extends Iterator<K> {
  constructor(private iterator: Iterator<T>, private transformer: OptionTransformer<T, K>) {
    // Filter map can change number of elements.
    super(new None());
  }

  next() {
    return this.iterator.findMap(this.transformer);
  }
}

export class Zip<T, K> extends Iterator<[T, K]> {
  constructor(private one: Iterator<T>, private other: Iterator<K>) {
    // If either of the iterators has no length, the zip iterator has no length.
    const len = Math.min(one.len().unwrapOr(-1), other.len().unwrapOr(-1));

    super(len === -1 ? new None() : new Some(len));
  }

  next() {
    const nextOne = this.one.next();
    const nextOther = this.other.next();

    if (nextOne.isNone() || nextOther.isNone()) {
      return new None<[T, K]>();
    }

    return new Some<[T, K]>([nextOne.unwrap(), nextOther.unwrap()]);
  }
}

export class Skip<T> extends Iterator<T> {
  constructor(private iterator: Iterator<T>, private n: number) {
    // Length is unknown at compile time.
    super(new None());
  }

  next() {
    while (this.n > 0) {
      this.iterator.next();
      this.n -= 1;
    }

    return this.iterator.next();
  }
}

export class SkipWhile<T> extends Iterator<T> {
  private doneSkipping = false;

  constructor(private iterator: Iterator<T>, private predicate: Predicate<T>) {
    // Length is unknown at compile time.
    super(new None());
  }

  next() {
    const next = this.doneSkipping ? this.iterator.next() : this.iterator.find((i) => !this.predicate(i));

    this.doneSkipping = true;

    return next;
  }
}

export class Take<T> extends Iterator<T> {
  constructor(private iterator: Iterator<T>, private n: number) {
    // Length is unknown at compile time.
    super(new None());
  }

  next() {
    if (this.n <= 0) {
      return new None<T>();
    }

    this.n -= 1;

    return this.iterator.next();
  }
}

export class TakeWhile<T> extends Iterator<T> {
  constructor(private iterator: Iterator<T>, private predicate: Predicate<T>) {
    // Length is unknown at compile time.
    super(new None());
  }

  next() {
    return this.iterator.next().filter(this.predicate);
  }
}
