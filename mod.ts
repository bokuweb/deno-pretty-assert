import { equal } from 'https://deno.land/x/testing/mod.ts';
import { red, green, white, bold } from 'https://deno.land/x/std/colors/mod.ts';
import diff, { DiffType } from 'https://denopkg.com/bokuweb/wu-diff-js@0.1.7/lib/index.ts';
import prettyFormat from './format.ts';

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

export function assertEqual(actual: unknown, expected: unknown, msg?: string) {
  if (equal(actual, expected)) {
    return;
  }
  const actualString = createStr(actual);
  const expectedString = createStr(expected);
  try {
    const diffResult = diff(actualString.split('\n'), expectedString.split('\n'));
    console.log('\n');
    console.log('\n');
    console.log(`    ${bold('[Diff]')} ${green(bold('Added'))} / ${red(bold('Removed'))}`);
    console.log('\n');
    console.log('\n');
    diffResult.forEach(result => {
      const _color = createColor(result.type);
      console.log(_color(`${createSign(result.type)}${result.value}\n`));
    });
    console.log('\n');
  } catch (e) {
    console.log('\n');
    console.log(red(CAN_NOT_DISPLAY) + '\n');
    console.log('\n');
  }
  if (!msg) {
    msg = `actual: ${actualString} expected: ${expectedString}`;
  }
  throw new Error(msg);
}

export const a = 1;
