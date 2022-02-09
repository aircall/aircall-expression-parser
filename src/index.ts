import { parse, ParserOptions } from './parser';

const defaultOptions: ParserOptions = {
  passContextToEmptyFunctions: true,
  transformArrayNegativeIndex: true,
};

export function resolveExpression<Context, T>(
  templatedString: string,
  context: Context = {} as Context,
  options: ParserOptions = defaultOptions,
): T | undefined {
  return compile<Context, T>(templatedString, options)(context);
}

function compile<Context, T>(
  str: string,
  options: ParserOptions,
): (context: Context) => T | undefined {
  if (typeof str !== 'string') {
    return () => str;
  }

  return (context: Context): T | undefined => {
    try {
      return parse<Context, T>(str, options)(context);
    } catch (err) {
      // support access to undefined object fields
      if (
        (err.name === 'TypeError' && err.message.match(/^Cannot read propert.+of undefined/)) ||
        (err.name === 'ReferenceError' && err.message.match(/^.+ is not defined/))
      ) {
        return undefined;
      }
      err.message = 'Parser Error: ' + err.message;
      throw err;
    }
  };
}
