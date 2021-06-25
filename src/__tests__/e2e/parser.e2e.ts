jest.unmock('js-x-ray');

import { resolveExpression } from '../../index';

describe('Parser E2E Test Suite', () => {
  describe('string literals', () => {
    it('should return a string with the value', () => {
      expect(resolveExpression('test')).toEqual('test');
      expect(
        resolveExpression('test', {
          variables: {
            output: 1,
          },
        }),
      ).toEqual('test');
    });
  });

  describe('accessing variables', () => {
    it('should extracts variable value', () => {
      expect(
        resolveExpression('${variables.input}', {
          variables: {
            input: 1,
          },
        }),
      ).toEqual(1);
    });

    it('should return undefined if not found', () => {
      expect(
        resolveExpression('${variables.input}', {
          variables: {
            output: 1,
          },
        }),
      ).toBeUndefined();
    });

    it('should return undefined for misspelled varailbes', () => {
      expect(
        resolveExpression('${varailbes.input}', {
          variables: {
            input: 1,
          },
        }),
      ).toBeUndefined();
    });

    it('should return arrays indexed value', () => {
      expect(
        resolveExpression('${variables.input[1]}', {
          variables: {
            input: [0, 1],
          },
        }),
      ).toEqual(1);
    });

    it('should return arrays negative indexed value', () => {
      expect(
        resolveExpression('${variables.input[-2]}', {
          variables: {
            input: [0, 1, 2],
          },
        }),
      ).toEqual(1);
    });

    it('should throw an error accessing an array without index', () => {
      expect(() =>
        resolveExpression('${variables.input[]}', {
          variables: {
            input: [0, 1],
          },
        }),
      ).toThrow();
    });

    it('should access string key index', () => {
      expect(
        resolveExpression('${variables.input["#complexName"]}', {
          variables: {
            input: {
              '#complexName': 1,
            },
          },
        }),
      ).toEqual(1);
    });

    it('should access a variable index', () => {
      expect(
        resolveExpression('${variables.input[keyVariable]}', {
          variables: {
            input: {
              testField: 1,
            },
          },
          keyVariable: 'testField',
        }),
      ).toEqual(1);
    });

    it('should access deep property paths', () => {
      expect(
        resolveExpression('${variables.input["#complexName"].list[0]}', {
          variables: {
            input: {
              '#complexName': {
                list: [1],
              },
            },
          },
        }),
      ).toEqual(1);
    });

    it('should return undefined when access to a field of an undefined object', () => {
      expect(
        resolveExpression('${variables.input["#complexName"].list[0]}', {
          variables: {
            input: undefined,
          },
        }),
      ).toBeUndefined();
    });

    describe('inline', () => {
      it('should parse variables to string', () => {
        expect(
          resolveExpression('PT${variables.input}S', {
            variables: {
              input: 0.1,
            },
          }),
        ).toEqual('PT0.1S');
      });

      it('should throw an error if there is an expression inside the expression', () => {
        expect(() =>
          resolveExpression('PT${variables[${variables.property}]}S', {
            variables: {
              input: 0.1,
              property: 'input',
            },
          }),
        ).toThrow();
      });

      it('should evaluate if there is an expression inside the expression properly defined', () => {
        expect(
          resolveExpression(
            '${environment.variables[`${environment.commonVariablePrefix}${environment.current}`]}',
            {
              environment: {
                variables: { a1: 1, a2: 2, a3: 3 },
                commonVariablePrefix: 'a',
                current: 2,
              },
            },
          ),
        ).toEqual(2);
      });

      it('should concatenate two variable scapes', () => {
        expect(
          resolveExpression('http://${variables.host}${variables.pathname}', {
            variables: {
              host: 'example.com',
              pathname: '/api/v1',
            },
          }),
        ).toEqual('http://example.com/api/v1');
      });

      it('should support ternary and logic operations', () => {
        expect(
          resolveExpression(
            'http://${variables.host}${variables.pathname || ""}${variables.pathname2 ? variables.pathname2 : ""}',
            {
              variables: {
                host: 'example.com',
                pathname: undefined,
                pathname2: null,
              },
            },
          ),
        ).toEqual('http://example.com');
      });
    });
  });

  describe('services', () => {
    it('returns service function', () => {
      expect(
        (
          resolveExpression('${services.get}', {
            services: {
              get: () => {
                return 'PT0.1S';
              },
            },
          }) as Function
        ).call(this),
      ).toEqual('PT0.1S');
    });

    it('should receive the context in empty functions', () => {
      expect(
        resolveExpression('${services.get()}', {
          variables: {
            timeout: 'PT0.1S',
          },
          services: {
            get: (message) => {
              return message.variables.timeout;
            },
          },
        }),
      ).toEqual('PT0.1S');
    });

    it('service accessing variables returns value', () => {
      expect(
        resolveExpression('${services.get({variables})}', {
          variables: {
            timeout: 'PT0.1S',
          },
          services: {
            get: (message) => {
              return message.variables.timeout;
            },
          },
        }),
      ).toEqual('PT0.1S');
    });

    it('expression with argument returns value', () => {
      expect(
        resolveExpression('${services.get(200)}', {
          services: {
            get: (statusCode) => {
              return statusCode;
            },
          },
        }),
      ).toEqual(200);
    });

    it('expression with object argument returns value', () => {
      expect(
        resolveExpression('${services.get({a: "test", b: "case"})}', {
          services: {
            get: (obj) => {
              return Object.values(obj).join(' ');
            },
          },
        }),
      ).toEqual('test case');
    });

    it('expression with object argument access to a variable and returns value', () => {
      expect(
        resolveExpression('${services.get({a, b: "case"})}', {
          a: 'test',
          services: {
            get: (obj) => {
              return Object.values(obj).join(' ');
            },
          },
        }),
      ).toEqual('test case');
    });

    it('expression with array argument returns value', () => {
      expect(
        resolveExpression('${services.get([1, 2, 3])}', {
          a: 'test',
          services: {
            get: (arr) => {
              return arr;
            },
          },
        }),
      ).toEqual([1, 2, 3]);
    });

    it('expression with array argument with a variable inside returns value', () => {
      expect(
        resolveExpression('${services.get([1, two, 3])}', {
          two: 2,
          services: {
            get: (arr) => {
              return arr;
            },
          },
        }),
      ).toEqual([1, 2, 3]);
    });

    it('expression with empty arguments returns value', () => {
      expect(
        resolveExpression('${services.get()}', {
          services: {
            get: () => {
              return '200';
            },
          },
        }),
      ).toEqual('200');
    });

    it('expression with argument addressing variables returns value', () => {
      expect(
        resolveExpression('${services.get(variables.input[0])}', {
          variables: {
            input: [200],
          },
          services: {
            get: (input) => {
              return input;
            },
          },
        }),
      ).toEqual(200);
    });

    it('expression with arguments addressing variables returns value', () => {
      expect(
        resolveExpression('${services.get(variables.input[0],variables.add)}', {
          variables: {
            input: [200],
            add: 1,
          },
          services: {
            get: (input, add) => {
              return input + add;
            },
          },
        }),
      ).toEqual(201);
    });

    it('expression with string arguments returns result', () => {
      expect(
        resolveExpression('${services.get("foo","bar")}', {
          services: {
            get(...args) {
              return args.toString();
            },
          },
        }),
      ).toEqual('foo,bar');

      expect(
        resolveExpression('${services.get("foo", "bar")}', {
          services: {
            get(...args) {
              return args.toString();
            },
          },
        }),
      ).toEqual('foo,bar');

      expect(
        resolveExpression('${services.get(  "foo",    "bar")}', {
          services: {
            get(...args) {
              return args.toString();
            },
          },
        }),
      ).toEqual('foo,bar');

      expect(
        resolveExpression('${services.get(true, "bar")}', {
          services: {
            get(...args) {
              return args;
            },
          },
        }),
      ).toEqual([true, 'bar']);

      expect(
        resolveExpression('${services.get(  false, "bar")}', {
          services: {
            get(...args) {
              return args;
            },
          },
        }),
      ).toEqual([false, 'bar']);

      expect(
        resolveExpression('${services.get(null,"bar")}', {
          services: {
            get(...args) {
              return args;
            },
          },
        }),
      ).toEqual([null, 'bar']);
    });
  });

  describe('specials', () => {
    it('expression ${null} return null', () => {
      expect(resolveExpression('${null}')).toBeNull();
    });

    it('expression ${true} return true', () => {
      expect(resolveExpression('${true}')).toBeTruthy();
    });

    it('expression ${false} return false', () => {
      expect(resolveExpression('${false}')).toBeFalsy();
    });

    it('expression ${0...} return number', () => {
      expect(resolveExpression('${0}')).toEqual(0);
      expect(resolveExpression('${1}')).toEqual(1);
      // Octal number
      expect(resolveExpression('${0o10}')).toEqual(8);
      expect(resolveExpression('${10.1}')).toEqual(10.1);
    });

    it('should work with lambda functions', () => {
      expect((resolveExpression('${() => "value"}') as Function).call(this)).toEqual('value');
      expect((resolveExpression('${(test) => test}') as Function).call(this, 1)).toEqual(1);
    });

    it('should throw an error if you do an unsafe operation', () => {
      expect(() => resolveExpression('${() => {require("fs").deleteSync(".")}}')).toThrow();
      expect(() =>
        (resolveExpression('${() => {global.testVariableToCheck = "unsafe"}') as Function).call(
          this,
        ),
      ).toThrow();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(() => testVariableToCheck).toThrow();
    });

    it('should support multiple lines inside the expression', () => {
      expect(
        (
          resolveExpression(`\${
        (value) => {
          return value;
        }}`) as Function
        ).call(this, 1),
      ).toEqual(1);
    });
  });
});
