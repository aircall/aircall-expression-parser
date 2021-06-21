import * as faker from 'faker';

jest.mock('../parser');
import { resolveExpression } from '../index';
import { parse } from '../parser';
import { getAsMock } from './helpers';

describe('@aircall/expression-parser Test Suite', () => {
  const setParseResult = (result: any) => getAsMock(parse).mockReturnValue(() => result);
  const setParseFn = (result: () => any) => getAsMock(parse).mockImplementation(result);

  describe('resolveExpression function', () => {
    it('should return the param if it is not an string', () => {
      const test = faker.datatype.number();
      const expected = test;

      expect(resolveExpression(test as any)).toEqual(expected);
    });

    it('should return the parser function result', () => {
      const test = faker.datatype.string();
      const parseResult = faker.datatype.number();
      setParseResult(parseResult);
      const expected = parseResult;

      expect(resolveExpression(test)).toEqual(expected);
    });

    it('should return undefined if the parser throw an error accessing a field of an undefined object', () => {
      const test = faker.datatype.string();
      setParseFn(() => {
        const notDefinedVariable = undefined;
        return notDefinedVariable.field;
      });
      const expected = undefined;

      expect(resolveExpression(test)).toEqual(expected);
    });

    it('should throw an error if the variable does not exist', () => {
      const test = faker.datatype.string();
      setParseFn(() => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return notExistsVariable;
      });
      const expected = undefined;

      expect(resolveExpression(test)).toEqual(expected);
    });

    it('should throw an error if the parse functions throws an error', () => {
      const test = faker.datatype.string();
      const error = new Error(faker.random.words());
      setParseFn(() => {
        throw error;
      });

      expect(() => resolveExpression(test)).toThrowError(error);
    });
  });
});
