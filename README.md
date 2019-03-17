## This package has already moved to https://github.com/denoland/deno_std/tree/master/testing.

# deno-pretty-assert

[![CircleCI](https://circleci.com/gh/bokuweb/deno-pretty-assert.svg?style=svg)](https://circleci.com/gh/bokuweb/deno-pretty-assert)

A colorful `assertEqual` for Deno.

### Screenshot

<img src="https://github.com/bokuweb/deno-pretty-assert/blob/master/screenshot.png?raw=true" />

### Usage

``` typescript
import { assertEqual } from 'https://deno.land/x/pretty_assert@0.1.6/mod.ts';

test({
  name: 'example',
  fn() {
    assertEqual(1, 2);
  },
});
```

## LICENSE

The MIT License (MIT)

Copyright (c) 2019 @bokuweb

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


