// This file is ported from pretty-format@24.0.0
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Config, Options, Refs, Optional } from './types.ts';
import { printIteratorEntries, printIteratorValues, printListItems, printObjectProperties } from './collections.ts';

const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = Symbol.prototype.toString;

const DEFAULT_OPTIONS: Options = {
  callToJSON: true,
  escapeRegex: false,
  escapeString: true,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  printFunctionName: true,
};

interface BasicValueOptions {
  printFunctionName: boolean;
  escapeRegex: boolean;
  escapeString: boolean;
}

/**
 * Explicitly comparing typeof constructor to function avoids undefined as name
 * when mock identity-obj-proxy returns the key as the value for any key.
 */
const getConstructorName = (val: new (...args: any[]) => any) =>
  (typeof val.constructor === 'function' && val.constructor.name) || 'Object';

/* global window */
/** Is val is equal to global window object? Works even if it does not exist :) */
const isWindow = (val: any) => typeof window !== 'undefined' && val === window;

const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;

function isToStringedArrayType(toStringed: string): boolean {
  return (
    toStringed === '[object Array]' ||
    toStringed === '[object ArrayBuffer]' ||
    toStringed === '[object DataView]' ||
    toStringed === '[object Float32Array]' ||
    toStringed === '[object Float64Array]' ||
    toStringed === '[object Int8Array]' ||
    toStringed === '[object Int16Array]' ||
    toStringed === '[object Int32Array]' ||
    toStringed === '[object Uint8Array]' ||
    toStringed === '[object Uint8ClampedArray]' ||
    toStringed === '[object Uint16Array]' ||
    toStringed === '[object Uint32Array]'
  );
}

function printNumber(val: number): string {
  return Object.is(val, -0) ? '-0' : String(val);
}

function printFunction(val: () => void, printFunctionName: boolean): string {
  if (!printFunctionName) {
    return '[Function]';
  }
  return '[Function ' + (val.name || 'anonymous') + ']';
}

function printSymbol(val: symbol): string {
  return symbolToString.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
}

function printError(val: Error): string {
  return '[' + errorToString.call(val) + ']';
}

/**
 * The first port of call for printing an object, handles most of the
 * data-types in JS.
 */
function printBasicValue(val: any, { printFunctionName, escapeRegex, escapeString }: BasicValueOptions): string | null {
  if (val === true || val === false) {
    return '' + val;
  }
  if (val === undefined) {
    return 'undefined';
  }
  if (val === null) {
    return 'null';
  }

  const typeOf = typeof val;

  if (typeOf === 'number') {
    return printNumber(val);
  }
  if (typeOf === 'string') {
    if (escapeString) {
      return '"' + val.replace(/"|\\/g, '\\$&') + '"';
    }
    return '"' + val + '"';
  }
  if (typeOf === 'function') {
    return printFunction(val, printFunctionName);
  }
  if (typeOf === 'symbol') {
    return printSymbol(val);
  }

  const toStringed = toString.call(val);

  if (toStringed === '[object WeakMap]') {
    return 'WeakMap {}';
  }
  if (toStringed === '[object WeakSet]') {
    return 'WeakSet {}';
  }
  if (toStringed === '[object Function]' || toStringed === '[object GeneratorFunction]') {
    return printFunction(val, printFunctionName);
  }
  if (toStringed === '[object Symbol]') {
    return printSymbol(val);
  }
  if (toStringed === '[object Date]') {
    return isNaN(+val) ? 'Date { NaN }' : toISOString.call(val);
  }
  if (toStringed === '[object Error]') {
    return printError(val);
  }
  if (toStringed === '[object RegExp]') {
    if (escapeRegex) {
      // https://github.com/benjamingr/RegExp.escape/blob/master/polyfill.js
      return regExpToString.call(val).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
    }
    return regExpToString.call(val);
  }

  if (val instanceof Error) {
    return printError(val);
  }

  return null;
}

/**
 * Handles more complex objects ( such as objects with circular references.
 * maps and sets etc )
 */
function printComplexValue(
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
): string {
  if (refs.indexOf(val) !== -1) {
    return '[Circular]';
  }
  refs = refs.slice();
  refs.push(val);

  const hitMaxDepth = ++depth > config.maxDepth;
  const { min, callToJSON } = config;

  if (callToJSON && !hitMaxDepth && val.toJSON && typeof val.toJSON === 'function' && !hasCalledToJSON) {
    return printer(val.toJSON(), config, indentation, depth, refs, true);
  }

  const toStringed = toString.call(val);
  if (toStringed === '[object Arguments]') {
    return hitMaxDepth
      ? '[Arguments]'
      : (min ? '' : 'Arguments ') + '[' + printListItems(val, config, indentation, depth, refs, printer) + ']';
  }
  if (isToStringedArrayType(toStringed)) {
    return hitMaxDepth
      ? '[' + val.constructor.name + ']'
      : (min ? '' : val.constructor.name + ' ') +
          '[' +
          printListItems(val, config, indentation, depth, refs, printer) +
          ']';
  }
  if (toStringed === '[object Map]') {
    return hitMaxDepth
      ? '[Map]'
      : 'Map {' + printIteratorEntries(val.entries(), config, indentation, depth, refs, printer, ' => ') + '}';
  }
  if (toStringed === '[object Set]') {
    return hitMaxDepth
      ? '[Set]'
      : 'Set {' + printIteratorValues(val.values(), config, indentation, depth, refs, printer) + '}';
  }

  // Avoid failure to serialize global window object in jsdom test environment.
  // For example, not even relevant if window is prop of React element.
  return hitMaxDepth || isWindow(val)
    ? '[' + getConstructorName(val) + ']'
    : (min ? '' : getConstructorName(val) + ' ') +
        '{' +
        printObjectProperties(val, config, indentation, depth, refs, printer) +
        '}';
}

function printer(
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
): string {
  const basicResult = printBasicValue(val, config);
  if (basicResult !== null) {
    return basicResult;
  }
  return printComplexValue(val, config, indentation, depth, refs, hasCalledToJSON);
}

const getConfig = (options: Options): Config => ({
  ...options,
  indent: options.min ? '' : createIndent(options.indent),
  spacingInner: options.min ? ' ' : '\n',
  spacingOuter: options.min ? '' : '\n',
});

function createIndent(indent: number): string {
  return new Array(indent + 1).join(' ');
}

/**
 * Returns a presentation string of your `val` object
 * @param val any potential JavaScript object
 * @param options Custom settings
 */
export function format(val: any, options: Optional<Options> = {}): string {
  const opts = Object.keys(DEFAULT_OPTIONS).reduce((acc: Options, k: keyof Options) => {
    const opt = options[k];
    if (typeof opt === 'undefined') {
      return { ...acc, [k]: DEFAULT_OPTIONS[k] };
    }
    return { ...acc, [k]: opt };
  }, {}) as Options;
  const basicResult = printBasicValue(val, opts);
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, getConfig(opts), '', 0, []);
}
