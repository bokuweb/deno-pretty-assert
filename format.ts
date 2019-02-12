// import style from 'ansi-styles';
import { Colors, Config, Options, OptionsReceived, NewPlugin, Plugin, Plugins, Refs, Theme } from './types.ts';

import { printIteratorEntries, printIteratorValues, printListItems, printObjectProperties } from './collections.ts';

// import AsymmetricMatcher from './plugins/AsymmetricMatcher';
// import ConvertAnsi from './plugins/ConvertAnsi';
// import DOMCollection from './plugins/DOMCollection';
// import DOMElement from './plugins/DOMElement';
// import Immutable from './plugins/Immutable';
// import ReactElement from './plugins/ReactElement';
// import ReactTestComponent from './plugins/ReactTestComponent';

const toString = Object.prototype.toString;
const toISOString = Date.prototype.toISOString;
const errorToString = Error.prototype.toString;
const regExpToString = RegExp.prototype.toString;
const symbolToString = Symbol.prototype.toString;

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
const NEWLINE_REGEXP = /\n/gi;

class PrettyFormatPluginError extends Error {
  constructor(message: string, stack: string) {
    super(message);
    this.stack = stack;
    this.name = this.constructor.name;
  }
}

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
function printBasicValue(
  val: any,
  printFunctionName: boolean,
  escapeRegex: boolean,
  escapeString: boolean,
): string | null {
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
  const min = config.min;

  if (config.callToJSON && !hitMaxDepth && val.toJSON && typeof val.toJSON === 'function' && !hasCalledToJSON) {
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

function isNewPlugin(plugin: Plugin): plugin is NewPlugin {
  return (plugin as NewPlugin).serialize != null;
}

function printPlugin(plugin: Plugin, val: any, config: Config, indentation: string, depth: number, refs: Refs): string {
  let printed;

  try {
    printed = isNewPlugin(plugin)
      ? plugin.serialize(val, config, indentation, depth, refs, printer)
      : plugin.print(
          val,
          valChild => printer(valChild, config, indentation, depth, refs),
          str => {
            const indentationNext = indentation + config.indent;
            return indentationNext + str.replace(NEWLINE_REGEXP, '\n' + indentationNext);
          },
          {
            edgeSpacing: config.spacingOuter,
            min: config.min,
            spacing: config.spacingInner,
          },
          config.colors,
        );
  } catch (error) {
    throw new PrettyFormatPluginError(error.message, error.stack);
  }
  if (typeof printed !== 'string') {
    throw new Error(`pretty-format: Plugin must return type "string" but instead returned "${typeof printed}".`);
  }
  return printed;
}

// function findPlugin(plugins: Plugins, val: any) {
//   for (let p = 0; p < plugins.length; p++) {
//     try {
//       if (plugins[p].test(val)) {
//         return plugins[p];
//       }
//     } catch (error) {
//       throw new PrettyFormatPluginError(error.message, error.stack);
//     }
//   }
//   return null;
// }

function printer(
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
): string {
  // const plugin = findPlugin(config.plugins, val);
  // if (plugin !== null) {
  //   return printPlugin(plugin, val, config, indentation, depth, refs);
  // }

  const basicResult = printBasicValue(val, config.printFunctionName, config.escapeRegex, config.escapeString);
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, config, indentation, depth, refs, hasCalledToJSON);
}

const DEFAULT_THEME: Theme = {
  comment: 'gray',
  content: 'reset',
  prop: 'yellow',
  tag: 'cyan',
  value: 'green',
};

const DEFAULT_THEME_KEYS = Object.keys(DEFAULT_THEME);

const DEFAULT_OPTIONS: Options = {
  callToJSON: true,
  escapeRegex: false,
  escapeString: true,
  highlight: false,
  indent: 2,
  maxDepth: Infinity,
  min: false,
  plugins: [],
  printFunctionName: true,
  theme: DEFAULT_THEME,
};

function validateOptions(options: OptionsReceived) {
  Object.keys(options).forEach(key => {
    if (!DEFAULT_OPTIONS.hasOwnProperty(key)) {
      throw new Error(`pretty-format: Unknown option "${key}".`);
    }
  });

  if (options.min && options.indent !== undefined && options.indent !== 0) {
    throw new Error('pretty-format: Options "min" and "indent" cannot be used together.');
  }

  if (options.theme !== undefined) {
    if (options.theme === null) {
      throw new Error(`pretty-format: Option "theme" must not be null.`);
    }

    if (typeof options.theme !== 'object') {
      throw new Error(
        `pretty-format: Option "theme" must be of type "object" but instead received "${typeof options.theme}".`,
      );
    }
  }
}

// const getColorsHighlight = (options: OptionsReceived): Colors =>
//   DEFAULT_THEME_KEYS.reduce((colors, key) => {
//     const value =
//       options.theme && (options.theme as any)[key] !== undefined
//         ? (options.theme as any)[key]
//         : (DEFAULT_THEME as any)[key];
//     const color = (style as any)[value];
//     if (color && typeof color.close === 'string' && typeof color.open === 'string') {
//       colors[key] = color;
//     } else {
//       throw new Error(
//         `pretty-format: Option "theme" has a key "${key}" whose value "${value}" is undefined in ansi-styles.`,
//       );
//     }
//     return colors;
//   }, Object.create(null));

const getColorsEmpty = (): Colors =>
  DEFAULT_THEME_KEYS.reduce((colors, key) => {
    colors[key] = { close: '', open: '' };
    return colors;
  }, Object.create(null));

const getPrintFunctionName = (options?: OptionsReceived) =>
  options && options.printFunctionName !== undefined ? options.printFunctionName : DEFAULT_OPTIONS.printFunctionName;

const getEscapeRegex = (options?: OptionsReceived) =>
  options && options.escapeRegex !== undefined ? options.escapeRegex : DEFAULT_OPTIONS.escapeRegex;

const getEscapeString = (options?: OptionsReceived) =>
  options && options.escapeString !== undefined ? options.escapeString : DEFAULT_OPTIONS.escapeString;

const getConfig = (options?: OptionsReceived): Config => ({
  callToJSON: options && options.callToJSON !== undefined ? options.callToJSON : DEFAULT_OPTIONS.callToJSON,
  colors: getColorsEmpty(),
  escapeRegex: getEscapeRegex(options),
  escapeString: getEscapeString(options),
  indent:
    options && options.min
      ? ''
      : createIndent(options && options.indent !== undefined ? options.indent : DEFAULT_OPTIONS.indent),
  maxDepth: options && options.maxDepth !== undefined ? options.maxDepth : DEFAULT_OPTIONS.maxDepth,
  min: options && options.min !== undefined ? options.min : DEFAULT_OPTIONS.min,
  plugins: options && options.plugins !== undefined ? options.plugins : DEFAULT_OPTIONS.plugins,
  printFunctionName: getPrintFunctionName(options),
  spacingInner: options && options.min ? ' ' : '\n',
  spacingOuter: options && options.min ? '' : '\n',
});

function createIndent(indent: number): string {
  return new Array(indent + 1).join(' ');
}

/**
 * Returns a presentation string of your `val` object
 * @param val any potential JavaScript object
 * @param options Custom settings
 */
function prettyFormat(val: any, options?: OptionsReceived): string {
  if (options) {
    validateOptions(options);
    // if (options.plugins) {
    //   const plugin = findPlugin(options.plugins, val);
    //   if (plugin !== null) {
    //     return printPlugin(plugin, val, getConfig(options), '', 0, []);
    //   }
    // }
  }

  const basicResult = printBasicValue(
    val,
    getPrintFunctionName(options),
    getEscapeRegex(options),
    getEscapeString(options),
  );
  if (basicResult !== null) {
    return basicResult;
  }

  return printComplexValue(val, getConfig(options), '', 0, []);
}

prettyFormat.plugins = {
  // AsymmetricMatcher,
  // ConvertAnsi,
  // DOMCollection,
  // DOMElement,
  // Immutable,
  // ReactElement,
  // ReactTestComponent,
};

export default prettyFormat;
