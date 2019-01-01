import { test } from 'https://deno.land/x/testing/testing.ts';
// @ts-ignore
import { assertEqual } from './index.ts';

test({
  name: 'failCaseObject',
  fn() {
    assertEqual(
      { c: 'abc', a: 'Hello', bar: ['bar', 10], foo: 'aaa' },
      { a: 'Hello', b: ['bbb'], foo: 'bbb', bar: ['bar', 20] },
    );
  },
});
