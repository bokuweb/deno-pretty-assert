import { equal } from 'https://deno.land/x/testing/mod.ts';
import { red, green, white, gray, bold } from 'https://deno.land/x/std/colors/mod.ts';
import diff, { DiffType, DiffResult } from 'https://denopkg.com/bokuweb/wu-diff-js@0.1.7/lib/index.ts';
import { format } from './format.ts';

const CAN_NOT_DISPLAY = '[Cannot display]';

function createStr(v: unknown): string {
  try {
    return format(v);
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

function showEmptyLine() {
  console.log('\n');
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
    showEmptyLine();
    showEmptyLine();
    console.log(`    ${gray(bold('[Diff]'))} ${green(bold('Added'))} / ${red(bold('Removed'))}`);
    showEmptyLine();
    showEmptyLine();
    diffResult.forEach((result: DiffResult) => {
      const c = createColor(result.type);
      console.log(c(`${createSign(result.type)}${result.value}\n`));
    });
    showEmptyLine();
  } catch (e) {
    showEmptyLine();
    console.log(red(CAN_NOT_DISPLAY) + '\n');
    showEmptyLine();
  }
  if (!msg) {
    msg = `actual: ${actualString} expected: ${expectedString}`;
  }
  throw new Error(msg);
}
