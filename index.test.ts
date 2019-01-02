import { test } from 'https://deno.land/x/testing/testing.ts';
// @ts-ignore
import { assertEqual } from 'https://deno.land/x/pretty_assert/index.ts';

test({
  name: 'passCases',
  fn() {
    assertEqual({ a: 10 }, { a: 10 });
    assertEqual(true, true);
    assertEqual(10, 10);
    assertEqual('abc', 'abc');
  },
});
