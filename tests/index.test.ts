import { iter, Some, None, custom_iter } from '../src/index';

// TODO: tests for .next calls to ensure O(n)
// TODO: bench for performance over vanilla filter, map, etc.
// TODO: tests in src files...?

test('filter map', () => {
  const result = iter<number>([1, 2, 3, 4, 5])
    .filter((x) => x % 2 === 0)
    .map((x) => x * 2)
    .collectArray();

  expect(result).toEqual([4, 8]);
});

test('find', () => {
  const result = iter<number>([1, 2, 3, 4, 5]).find((x) => x % 2 === 0);

  expect(result.unwrap()).toEqual(2);
});

test('filterMap', () => {
  const result = iter<number>([1, 2, 3, 4, 5])
    .filterMap((x) => {
      if (x % 2 === 0) {
        return new Some(x * 2);
      }

      return new None();
    })
    .collectArray();

  expect(result).toEqual([4, 8]);
});

test('all', () => {
  const result1 = iter<number>([1, 2, 3, 4, 5]).all((x) => x < 10);
  const result2 = iter<number>([1, 2, 3, 4, 5]).all((x) => x < 4);

  expect(result1).toEqual(true);
  expect(result2).toEqual(false);
});

test('any', () => {
  const result1 = iter<number>([1, 2, 3, 4, 5]).any((x) => x % 2 === 0);
  const result2 = iter<number>([1, 3, 5, 7, 9]).any((x) => x % 2 === 0);

  expect(result1).toEqual(true);
  expect(result2).toEqual(false);
});

test('fold', () => {
  const result = iter<number>([1, 2, 3, 4, 5]).fold(0, (acc, x) => acc + x);

  expect(result).toEqual(15);
});

test('tryFold', () => {
  const result1 = iter<number>([1, 2, 3, 4, 5]).tryFold(0, (acc, x) => {
    if (x === 3) {
      return new None();
    }

    return new Some(acc + x);
  });

  const result2 = iter<number>([1, 2, 3, 4, 5]).tryFold(0, (acc, x) => {
    return new Some(acc + x);
  });

  expect(result1.isNone()).toEqual(true);
  expect(result2.unwrap()).toEqual(15);
});

test('forEach', () => {
  let result = 0;

  iter<number>([1, 2, 3, 4, 5]).forEach((x) => {
    result += x;
  });

  expect(result).toEqual(15);
});

test('count', () => {
  const result = iter<number>([1, 2, 3, 4, 5]).count();

  expect(result).toEqual(5);
});

test('map', () => {
  const map = new Map<string, number>();

  map.set('a', 1);
  map.set('b', 2);
  map.set('c', 3);

  const result = iter<[string, number]>(map).fold(0, (acc, [_, v]) => acc + v);

  expect(result).toEqual(6);
});

test('len', () => {
  const result = iter<number>([1, 2, 3, 4, 5]).len();

  expect(result.unwrap()).toEqual(5);
});

test('len 2', () => {
  const result = iter<number>([1, 2, 3, 4, 5])
    .filter((x) => x % 2 === 0)
    .len();

  expect(result.isNone()).toEqual(true);
});

test('zip', () => {
  const result = iter<number>([1, 2, 3, 4, 5])
    .filter((x) => x % 2 === 0)
    .zip<number>([10, 20, 30, 40, 50])
    .collectArray();

  expect(result).toEqual([
    [2, 10],
    [4, 20],
  ]);
});

test('zip 2', () => {
  const result = custom_iter<number>(0, (i) => new Some(i + 1))
    .zip<string>(['a', 'b', 'c', 'd', 'e'])
    .collectArray();

  expect(result).toEqual([
    [0, 'a'],
    [1, 'b'],
    [2, 'c'],
    [3, 'd'],
    [4, 'e'],
  ]);
});

// Caveats.

test('mutability', () => {
  const items = [{ a: 1 }, { a: 2 }, { a: 3 }];
  const iterator = iter<{ a: number }>(items);

  // !! Mutate the first item.
  items[0].a = 10;

  const result = iterator.fold(0, (acc, { a }) => acc + a);

  expect(result).toEqual(15);
});

// DeepReadonly<T> ensures that this does not compile.
// test('mutability 2', () => {
//   const items = [{ a: 1 }, { a: 2 }, { a: 3 }];
//   const iterator = iter<{ a: number }>(items);

//   const result = iterator
//     .filter((i) => {
//       // !! Mutate in filter loop.
//       i.a = 10;

//       return i.a > 3;
//     })
//     .fold(0, (acc, { a }) => acc + a);

//   expect(result).toEqual(30);
// });
