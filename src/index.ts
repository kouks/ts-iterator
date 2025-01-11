import { Some as OptionSome, None as OptionNone, Option } from './option/Option';
import { Base, Custom } from './iter/Iterator';
import type { DeepReadonly, Iterable } from './types';

export const iter = <T>(iterable: Iterable<DeepReadonly<T>>) => {
  return new Base(iterable);
};

export const customIter = <T>(initial: T, next: (prev: T) => Option<T>) => {
  return new Custom<T>(initial, next);
};

export const Some = <T>(value: T) => new OptionSome<T>(value);
export const None = <T>() => new OptionNone<T>();
