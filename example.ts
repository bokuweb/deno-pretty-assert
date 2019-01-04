import { test } from 'https://deno.land/x/testing/mod.ts';
// @ts-ignore
import { assertEqual } from 'https://deno.land/x/pretty_assert/mod.ts';

test({
  name: 'failCaseObject',
  fn() {
    assertEqual(
      { c: 'abc', a: 'Hello', bar: ['bar', 10], foo: 'aaa' },
      { a: 'Hello', b: ['bbb'], foo: 'bbb', bar: ['bar', 20] },
    );
  },
});
