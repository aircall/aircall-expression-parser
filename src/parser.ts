import { runASTAnalysis } from 'js-x-ray';

import { prepareStr, removeBL } from './transforms';

export interface ParserOptions {
  /**
   * Allow to pass the context object into empty functions calls in single expression strings.
   * Anonymous functions are not supported
   */
  passContextToEmptyFunctions?: boolean;
  /**
   * Allow and parse negative indexes correctly
   */
  transformArrayNegativeIndex?: boolean;
}

export function parse<Context, T>(
  strToParse: string,
  options: ParserOptions,
): (context: Context) => T {
  strToParse = removeBL(strToParse);
  const expRegEx = /\$\{.*\}/g;

  return (context: Context): T => {
    const returnLiteral = () =>
      securityChecker(
        `${contextToString(context)}return ${prepareStr(strToParse.slice(2, -1), options)};`,
      );
    const returnString = () =>
      securityChecker(`${contextToString(context)}return \`${prepareStr(strToParse, options)}\`;`);

    try {
      return expRegEx.exec(strToParse)
        ? // eslint-disable-next-line no-new-func
          (Function('context', returnLiteral())(context) as T)
        : // eslint-disable-next-line no-new-func
          (Function('context', returnString())(context) as T);
    } catch (err) {
      // eslint-disable-next-line no-new-func
      return Function('context', returnString())(context) as T;
    }
  };
}

/**
 * @param str - Javascript code in string format to check if it is secure
 * @returns The str param or throw an error if the str in not secure
 */
function securityChecker(str: string): string {
  const fnWrapperStr = `function check(context) {${str}}`;
  const { warnings, dependencies } = runASTAnalysis(fnWrapperStr);

  const inTryDeps = [...dependencies.getDependenciesInTryStatement()];

  if (Object.keys(dependencies.dependencies).length > 0 || inTryDeps.length > 0) {
    throw new Error('Insecure module import');
  }
  if (warnings.length > 0) {
    throw new Error('Security problems detected: ' + warnings.join(', '));
  }
  return str;
}

/**
 *
 * @param context - object to convert to a string variable
 * declaration
 * @returns string with all properties assigned to variables named with
 * context field names and the context fields added to the Function `this`
 * context
 */
function contextToString<Context>(context: Context): string {
  let declarationString = '';
  for (const key in context) {
    if (Object.prototype.hasOwnProperty.call(context, key)) {
      declarationString += `const ${key}=context['${key}'];this.${key}=context['${key}'];`;
    }
  }
  return declarationString;
}
