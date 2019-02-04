import { equal } from 'https://deno.land/x/testing/mod.ts';
import { red, green, white, bold } from 'https://deno.land/x/std/colors/mod.ts';
import diff, { DiffType } from 'https://denopkg.com/bokuweb/wu-diff-js@0.1.6/lib/index.ts';
import prettyFormat from './pretty-format/dist/index.js';

const CAN_NOT_DISPLAY = '[Cannot display]';

function createStr(v: unknown): string {
  try {
    return prettyFormat(v);
  } catch (e) {
    return red(CAN_NOT_DISPLAY);
  }
}

function createColor(diffType: DiffType) {
  switch (diffType) {
    case 'added':
      return green;
    case 'removed':
      return red;
    default:
      return white;
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
    log(`    ${bold('[Diff]')} ${green(bold('Added'))} / ${red(bold('Removed'))}`);
    log('');
    diffResult.forEach(result => {
      const _color = createColor(result.type);
      log(_color(`${createSign(result.type)}${result.value}`));
    });
    log('');
  } catch (e) {
    log('');
    log(red(CAN_NOT_DISPLAY));
    log('');
  }
  throw new Error(msg && 'assertEqual failed.');
}
