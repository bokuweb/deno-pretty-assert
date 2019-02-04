import { test } from 'https://deno.land/x/testing/mod.ts';
// @ts-ignore
import { assertEqual } from './mod.ts';

test({
  name: 'passCases',
  fn() {
    assertEqual({ a: 10 }, { a: 10 });
    assertEqual(true, true);
    assertEqual(10, 10);
    assertEqual('abc', 'abc');
  },
});
