import { ParserOptions } from './parser';

/**
 * Do some operations to the string code before compile it depending on the options defined
 */
export function prepareStr(str: string, options: ParserOptions): string {
  const strTransformFns = [];
  if (options.passContextToEmptyFunctions) {
    strTransformFns.push(replaceEmptyFnToReceiveContext);
  }
  if (options.transformArrayNegativeIndex) {
    strTransformFns.push(replaceNegativeIndexes);
  }

  return strTransformFns.reduce((result, fn) => fn(result), str);
}

/**
 * Look for negative indexes with a regular expression in the string and
 * replace them with equivalent array operations
 */
function replaceNegativeIndexes(str: string): string {
  const negativeArrayIndexesRegEx = /\s*\[\s*(-\s*\d)+\s*\]\s*/g;
  return str.replace(negativeArrayIndexesRegEx, '.slice($1).shift()');
}

/**
 * Pass the context to empty functions
 */
function replaceEmptyFnToReceiveContext(str: string): string {
  const emptyFnRegEx = /((\w|_|\$)+(\w|\d|\$|_|[|]|\(|\))*)\(\)/g;
  return str.replace(emptyFnRegEx, '$1(this)');
}

/**
 * Remove break lines and spaces before and after the str
 */
export function removeBL(str: string): string {
  return str.replace(/[\r\n]+/gm, ' ').trim();
}
