import faker from 'faker';

import { prepareStr, removeBL } from '../transforms';

describe('Transforms Test Suite', () => {
  describe('removeBL function', () => {
    it('should replace new lines of a string by spaces', () => {
      const test = faker.random.word();
      const test2 = faker.random.word();
      const expected = test + ' ' + test2;

      expect(removeBL(test + '\r\n' + test2 + ' ')).toBe(expected);
    });
  });

  describe('prepareStr function', () => {
    it('should replace negative indexes by correct javascript array access', () => {
      const test = 'test[-1]';
      const expected = 'test.slice(-1).shift()';

      expect(prepareStr(test, { transformArrayNegativeIndex: true })).toBe(expected);
    });

    it('should replace empty functions to receive the current context as an argument', () => {
      const test = 'test()';
      const expected = 'test(this)';

      expect(prepareStr(test, { passContextToEmptyFunctions: true })).toBe(expected);
    });

    it('should do all operations', () => {
      const test = 'test()[-1]';
      const expected = 'test(this).slice(-1).shift()';

      expect(
        prepareStr(test, { passContextToEmptyFunctions: true, transformArrayNegativeIndex: true }),
      ).toBe(expected);
    });

    it('should do nothing if the options are not passed', () => {
      const test = 'test()[-1]';

      expect(prepareStr(test, {})).toBe(test);
    });

    it('should not do catastrophic backtracking with a complicated string', () => {
      const test = Array(100).fill('_________________').join('/');
      const start = Date.now();
      prepareStr(test, { passContextToEmptyFunctions: true });
      const end = Date.now();

      // reference values on a Ryzen 5 2600X
      // old: ~10s
      // optimized: 0.1ms
      console.log(end - start);
      expect(end - start).toBeLessThan(50);
    });
  });
});
