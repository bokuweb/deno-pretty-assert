import { equal } from 'https://deno.land/x/testing/mod.ts';
import { red, green, white, gray, bold, bgBlue } from 'https://deno.land/x/std/colors/mod.ts';
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
      return (s: string) => green(bold(s));
    case 'removed':
      return (s: string) => red(bold(s));
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

function buildMessage(diffResult: ReadonlyArray<DiffResult<string>>) {
  const messages = [];
  messages.push('');
  messages.push('');
  messages.push(`    ${gray(bold('[Diff]'))} ${green(bold('Added'))} / ${red(bold('Removed'))}`);
  messages.push('');
  messages.push('');
  diffResult.forEach((result: DiffResult<string>) => {
    const c = createColor(result.type);
    messages.push(c(`${createSign(result.type)}${result.value}`));
  });
  messages.push('');

  return messages;
}

export function assertEqual(actual: unknown, expected: unknown) {
  if (equal(actual, expected)) {
    return;
  }
  let message = '';
  const actualString = createStr(actual);
  const expectedString = createStr(expected);
  try {
    const diffResult = diff(actualString.split('\n'), expectedString.split('\n'));
    message = buildMessage(diffResult).join('\n');
  } catch (e) {
    message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
  }
  throw new Error(message);
}
