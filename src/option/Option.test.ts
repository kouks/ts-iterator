// Generate tests for Option.ts

import { None, Some } from './Option';

describe('Some', () => {
  test('isSome', () => {
    const option = new Some(1);

    expect(option.isSome()).toEqual(true);
  });

  test('isNone', () => {
    const option = new Some(1);

    expect(option.isNone()).toEqual(false);
  });

  test('unwrap', () => {
    const option = new Some(1);

    expect(option.unwrap()).toEqual(1);
  });

  test('unwrapOr', () => {
    const option = new Some(1);

    expect(option.unwrapOr()).toEqual(1);
  });

  test('unwrapOrElse', () => {
    const option = new Some(1);

    expect(option.unwrapOrElse()).toEqual(1);
  });

  test('expect', () => {
    const option = new Some(1);

    expect(option.expect()).toEqual(1);
  });

  test('filter', () => {
    const option = new Some(1);

    expect(option.filter((x) => x === 1).unwrap()).toEqual(1);
  });

  test('map', () => {
    const option = new Some(1);

    expect(option.map((x) => x * 2).unwrap()).toEqual(2);
  });

  test('mapOr', () => {
    const option = new Some(1);

    expect(option.mapOr((x) => x * 2)).toEqual(2);
  });

  test('mapOrElse', () => {
    const option = new Some(1);

    expect(option.mapOrElse((x) => x * 2)).toEqual(2);
  });

  test('and', () => {
    const option = new Some(1);

    expect(option.and(new Some(2)).unwrap()).toEqual(2);
  });

  test('andThen', () => {
    const option = new Some(1);

    expect(option.andThen((x) => new Some(x * 2)).unwrap()).toEqual(2);
  });

  test('or', () => {
    const option = new Some(1);

    expect(option.or(new Some(2)).unwrap()).toEqual(1);
  });

  test('orElse', () => {
    const option = new Some(1);

    expect(option.orElse()).toEqual(option);
  });
});

describe('None', () => {
  test('isSome', () => {
    const option = new None();

    expect(option.isSome()).toEqual(false);
  });

  test('isNone', () => {
    const option = new None();

    expect(option.isNone()).toEqual(true);
  });

  test('unwrap', () => {
    const option = new None();

    expect(() => option.unwrap()).toThrow();
  });

  test('unwrapOr', () => {
    const option = new None();

    expect(option.unwrapOr(1)).toEqual(1);
  });

  test('unwrapOrElse', () => {
    const option = new None();

    expect(option.unwrapOrElse(() => 1)).toEqual(1);
  });

  test('expect', () => {
    const option = new None();

    expect(() => option.expect(new Error('test'))).toThrow();
  });

  test('filter', () => {
    const option = new None();

    expect(option.filter((x) => x === 1).isNone()).toEqual(true);
  });

  test('map', () => {
    const option = new None();

    expect(option.map(() => 2).isNone()).toEqual(true);
  });

  test('mapOr', () => {
    const option = new None();

    expect(option.mapOr(() => 4, 2)).toEqual(2);
  });

  test('mapOrElse', () => {
    const option = new None();

    expect(
      option.mapOrElse(
        () => 3,
        () => 2,
      ),
    ).toEqual(2);
  });

  test('and', () => {
    const option = new None();

    expect(option.and(new Some(2)).isNone()).toEqual(true);
  });

  test('andThen', () => {
    const option = new None();

    expect(option.andThen(() => new Some(2)).isNone()).toEqual(true);
  });

  test('or', () => {
    const option = new None();

    expect(option.or(new Some(2)).unwrap()).toEqual(2);
  });

  test('orElse', () => {
    const option = new None();

    expect(option.orElse(() => new Some(2))).toEqual(new Some(2));
  });
});
