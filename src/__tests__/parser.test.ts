import * as faker from 'faker';
import { runASTAnalysis } from 'js-x-ray';

import { parse } from '../parser';
import { prepareStr, removeBL } from '../transforms';
import { getAsMock } from './helpers';

jest.mock('../transforms');

describe('parser Test Suite', () => {
  describe('parse function', () => {
    getAsMock(removeBL).mockImplementation((str) => str);
    getAsMock(prepareStr).mockImplementation((str) => str);
    const mockASTAnalysis = (warnings = [], dependencies = {}, inTryDeps = []): any => ({
      warnings,
      dependencies: {
        getDependenciesInTryStatement: jest.fn().mockReturnValue(inTryDeps),
        dependencies,
      },
    });

    beforeEach(() => {
      getAsMock(runASTAnalysis).mockReturnValue(mockASTAnalysis());
    });

    it('should return a string literal', () => {
      const test = {
        str: 'test',
      };
      const expected = test.str;

      expect(parse(test.str, {})(undefined)).toBe(expected);
    });

    it('should return a value from a single expression', () => {
      const test = {
        str: '${value}',
        context: { value: faker.datatype.number() },
      };
      const expected = test.context.value;

      expect(parse(test.str, {})(test.context)).toBe(expected);
    });

    it('should return a string from multiple expressions', () => {
      const test = {
        str: '${value}${value}',
        context: { value: faker.datatype.number() },
      };
      const expected = `${test.context.value}${test.context.value}`;

      expect(parse(test.str, {})(test.context)).toBe(expected);
    });

    it('should throw an error if the security helper function detects any file import', () => {
      const test = {
        str: '${value}',
        context: { value: faker.datatype.number() },
      };
      const error = new Error('Insecure module import');
      getAsMock(runASTAnalysis).mockReturnValue(mockASTAnalysis(undefined, { test: 'test' }));

      expect(() => parse(test.str, {})(test.context)).toThrowError(error);
    });

    it('should throw an error if the security helper function detects any warning', () => {
      const test = {
        str: '${value}',
        context: { value: faker.datatype.number() },
      };
      const fakeWarning = faker.datatype.string();
      getAsMock(runASTAnalysis).mockReturnValue(mockASTAnalysis([fakeWarning]));
      const error = new Error('Security problems detected: ' + fakeWarning);

      expect(() => parse(test.str, {})(test.context)).toThrowError(error);
    });
  });
});
