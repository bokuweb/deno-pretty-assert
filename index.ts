// tslint:disable-next-line
import { test, equal } from 'https://deno.land/x/testing/testing.ts';
// tslint:disable-next-line
import { color } from 'https://deno.land/x/colors/main.ts';
// tslint:disable-next-line
import diff, { DiffType } from 'https://denopkg.com/bokuweb/wu-diff-js@0.1.6/lib/index.ts';
import prettyFormat from './pretty-format/dist/index.js';

const CAN_NOT_DISPLAY = '[Cannot display]';

function createStr(v: unknown): string {
  try {
    return prettyFormat(v);
  } catch (e) {
    return color.redBright(CAN_NOT_DISPLAY);
  }
}

function createColor(diffType: DiffType) {
  switch (diffType) {
    case 'added':
      return color.greenBright;
    case 'removed':
      return color.redBright;
    default:
      return color.white;
  }
}

function createSign(diffType: DiffType) {
  switch (diffType) {
    case 'added':
      return '+   ';
    case 'removed':
      return '-   ';
    default:
      return '    ';
  }
}

export function assertEqual(actual: unknown, expected: unknown, msg?: string, out?: (log: string) => void) {
  if (equal(actual, expected)) {
    return;
  }
  // tslint:disable-next-line
  const log = out || console.log;
  const actualString = createStr(actual);
  const expectedString = createStr(expected);
  try {
    const diffResult = diff(actualString.split('\n'), expectedString.split('\n'));
    log('');
    log(`    [Diff] ${color.bgGreenBright.white.bold('Added')} / ${color.bgRedBright.white.bold('Removed')}`);
    log('');
    diffResult.forEach(result => {
      const _color = createColor(result.type);
      log(_color(`${createSign(result.type)}${result.value}`));
    });
    log('');
  } catch (e) {
    log('');
    log(color.redBright(CAN_NOT_DISPLAY));
    log('');
  }
  throw new Error(msg && 'assertEqual failed.');
}
