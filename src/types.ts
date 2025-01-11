import type { Option } from './option/Option';

// Anything that has a Symbol.iterator method is an iterable.
export type Iterable<T> = { [Symbol.iterator]: () => IteratorObject<T, undefined, T>; length?: number; size?: number };

// Predicate is a function that takes a value and returns a boolean.
export type Predicate<T> = (value: T) => boolean;

// Transformer is a function that takes a value and returns a new value.
export type Transformer<T, K> = (value: T) => K;

// OptionTransformer is a function that takes a value and returns a new Option.
export type OptionTransformer<T, K> = (value: T) => Option<K>;

// Reducer is a function that takes an accumulator and a value and returns a new accumulator.
export type Reducer<A, T> = (accumulator: A, value: T) => A;

// OptionReducer is a function that takes an accumulator and a value and returns a new Option accumulator.
export type OptionReducer<A, T> = (accumulator: A, value: T) => Option<A>;

// DeepReadonly is a type that makes all properties of an object readonly.
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Wrapper around node's iterator for convenience.
export type NodeIterator<T> = Iterator<T, undefined, T>;
