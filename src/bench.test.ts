import { iter } from './index';

describe('bench', () => {
  describe('vanilla', () => {
    test('1 operator', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = array.map((x) => x * 2);

      expect(result[0]).toEqual(0);
      expect(result[1]).toEqual(2);

      console.log('vanilla 1 op', Date.now() - now, 'ms');
    });

    test('2 operators', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = array.map((x) => x * 2).filter((x) => x % 4 === 0);

      expect(result[0]).toEqual(0);
      expect(result[1]).toEqual(4);

      console.log('vanilla 2 ops', Date.now() - now, 'ms');
    });

    test('3 operators', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = array
        .map((x) => x * 2)
        .map((x) => x * 2)
        .filter((x) => x % 8 === 0);

      expect(result[0]).toEqual(0);
      expect(result[1]).toEqual(8);

      console.log('vanilla 3 ops', Date.now() - now, 'ms');
    });

    test('3 operators loop elements', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = array
        .map((x) => x * 2)
        .map((x) => x * 2)
        .filter((x) => x % 8 === 0);

      let i = 0;

      for (const _ of result) {
        i++;
      }

      console.log('vanilla 3 ops loop', i, Date.now() - now, 'ms');
    });
  });

  describe('ts-iterator', () => {
    test('1 operator', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);
      const now = Date.now();

      const result = iter<number>(array).map((x) => x * 2);

      expect(result.next().unwrap()).toEqual(0);
      expect(result.next().unwrap()).toEqual(2);

      console.log('ts-iterator 1 op', Date.now() - now, 'ms');
    });

    test('2 operators', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = iter<number>(array)
        .map((x) => x * 2)
        .filter((x) => x % 4 === 0);

      expect(result.next().unwrap()).toEqual(0);
      expect(result.next().unwrap()).toEqual(4);

      console.log('ts-iterator 2 ops', Date.now() - now, 'ms');
    });

    test('3 operators', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = iter<number>(array)
        .map((x) => x * 2)
        .map((x) => x * 2)
        .filter((x) => x % 8 === 0);

      expect(result.next().unwrap()).toEqual(0);
      expect(result.next().unwrap()).toEqual(8);

      console.log('ts-iterator 3 ops', Date.now() - now, 'ms');
    });

    test('3 operators loop elements', () => {
      const array = Array.from({ length: 10_000_000 }, (_, i) => i);

      const now = Date.now();

      const result = iter<number>(array)
        .map((x) => x * 2)
        .map((x) => x * 2)
        .filter((x) => x % 8 === 0);

      let i = 0;

      while (result.next().isSome()) {
        i++;
      }

      console.log('ts-iterator 3ops loop', i, Date.now() - now, 'ms');
    });
  });
});
