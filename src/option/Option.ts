import type { OptionTransformer, Predicate, Transformer } from '../types';

export interface Option<T> {
  /**
   * Determines whether the option wraps any value (is instance of `Some`).
   *
   * @return Whether the option wraps value
   */
  isSome(): boolean;

  /**
   * Determines whether the option has no value (is instance of `None`).
   *
   * @return Whether the option wraps value
   */
  isNone(): boolean;

  /**
   * Returns the value or throws an exception if the option is `None`.
   *
   * @return Returns the wrapped value from the option if the option is Some<T>
   * @throws {OptionIsNoneException}
   */
  unwrap(): T;

  /**
   * If the option is Some<T>, returns the value, otherwise returns `def`.
   *
   * @param def The default value
   * @return If option is Some<T>, return the value, otherwise return the default value
   */
  unwrapOr(def: T): T;

  /**
   * If the option is `Some`, returns the value, otherwise computes the `fn`
   * and returns the result.
   *
   * @param fn The fn to be evaluated
   * @return The wrapped value if option in Some<T>, otherwise the return value from the provided fn
   */
  unwrapOrElse(fn: () => T): T;

  /**
   * If the option is `Some`, return it. Otherwise, throws the error `e`.
   *
   * @param e The error to be thrown
   * @return Returns wrapped value
   * @throws {Error}
   */
  expect(e: Error): T;

  /**
   * Returns `None` if the option is `None`, otherwise calls predicate with the
   * value and returns `Some` if the predicate returns `true`, or `None` if the
   * predicate returns `false`.
   *
   * @param fn The predicate to decide based on
   * @return Either Some<T> or None<T> based on the predicate
   */
  filter(fn: Predicate<T>): Option<T>;

  /**
   * Maps an Option<T> to Option<U> by applying `fn` to a contained value (if Some) or returns None.
   *
   * @param fn The predicate that maps the Option
   * @return The mapped Option
   */
  map<U>(fn: Transformer<T, U>): Option<U>;

  /**
   * Returns the provided default result (if None), or applies `fn` to the contained value (if Some).
   *
   * @param fn The predicate that maps T to U
   * @param def Default in case the option is None
   * @erturn Either result from predicate or default
   */
  mapOr<U>(fn: Transformer<T, U>, def: U): U;

  /**
   * Computes a default function result (if None), or applies a different function to the contained value (if Some).
   *
   * @param fn The predicate that maps T to U
   * @param def Computes default in case the option is None
   * @erturn Either result from predicate or default
   */
  mapOrElse<U>(fn: Transformer<T, U>, def: () => U): U;

  /**
   * Returns None if the option is None, otherwise returns `other`.
   *
   * @param other Option<U> to return if this is None
   * @erturn Either this or other
   */
  and<U>(other: Option<U>): Option<U>;

  /**
   * Returns None if the option is None, otherwise calls `fn` with the wrapped value and returns the result.
   *
   * @param fn Transforms T into a new type wrapped in Option
   * @erturn Either result from predicate or default
   */
  andThen<U>(fn: OptionTransformer<T, U>): Option<U>;

  /**
   * Returns the option if it contains a value, otherwise returns `other`.
   *
   * @param other Another Option
   * @return Either this or other
   */
  or(other: Option<T>): Option<T>;

  /**
   * Returns the option if it contains a value, otherwise calls `fn` and returns the result.
   *
   * @param fn Function that returns new Option
   * @return Either this or default
   */
  orElse(fn: () => Option<T>): Option<T>;
}

export class Some<T> implements Option<T> {
  /**
   * @param value The value to be wrapped in the option
   */
  constructor(private value: T) {
    //
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

  unwrapOr(): T {
    return this.value;
  }

  unwrapOrElse(): T {
    return this.value;
  }

  expect(): T {
    return this.value;
  }

  filter(predicate: (t: T) => boolean): Option<T> {
    return predicate(this.value) ? this : new None<T>();
  }

  map<U>(predicate: Transformer<T, U>): Option<U> {
    return new Some(predicate(this.value));
  }

  mapOr<U>(predicate: Transformer<T, U>): U {
    return predicate(this.value);
  }

  mapOrElse<U>(predicate: Transformer<T, U>): U {
    return predicate(this.value);
  }

  and<U>(other: Option<U>): Option<U> {
    return other;
  }

  andThen<U>(closure: OptionTransformer<T, U>): Option<U> {
    return closure(this.value);
  }

  or(_: Option<T>): Option<T> {
    return this;
  }

  orElse(): Option<T> {
    return this;
  }
}

export class None<T> implements Option<T> {
  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  unwrap(): T {
    throw new OptionIsNoneException();
  }

  unwrapOr(def: T): T {
    return def;
  }

  unwrapOrElse(closure: () => T): T {
    return closure();
  }

  expect(e: Error): T {
    throw e;
  }

  filter(_: Predicate<T>): Option<T> {
    return new None<T>();
  }

  map<U>(_: Transformer<T, U>): Option<U> {
    return new None<U>();
  }

  mapOr<U>(_: Transformer<T, U>, def: U): U {
    return def;
  }

  mapOrElse<U>(_: Transformer<T, U>, closure: () => U): U {
    return closure();
  }

  and<U>(_: Option<U>): Option<U> {
    return new None();
  }

  andThen<U>(_: OptionTransformer<T, U>): Option<U> {
    return new None<U>();
  }

  or(def: Option<T>): Option<T> {
    return def;
  }

  orElse(closure: () => Option<T>): Option<T> {
    return closure();
  }
}

export class OptionIsNoneException extends Error {
  //
}
