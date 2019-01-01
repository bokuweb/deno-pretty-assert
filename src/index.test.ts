import { test } from 'https://deno.land/x/testing/testing.ts';
// @ts-ignore
import { assertEqual } from 'https://denopkg.com/bokuweb/deno-pretty-assert/src/index.ts';

test({
  name: 'passCases',
  fn() {
    assertEqual({ a: 10 }, { a: 10 });
    assertEqual(true, true);
    assertEqual(10, 10);
    assertEqual('abc', 'abc');
  },
});
