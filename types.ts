// This file is ported from pretty-format@24.0.0
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
export type Refs = any[];
export type Optional<T> = { [K in keyof T]?: T[K] };

export interface Options {
  callToJSON: boolean;
  escapeRegex: boolean;
  escapeString: boolean;
  indent: number;
  maxDepth: number;
  min: boolean;
  printFunctionName: boolean;
}

export interface Config {
  callToJSON: boolean;
  escapeRegex: boolean;
  escapeString: boolean;
  indent: string;
  maxDepth: number;
  min: boolean;
  printFunctionName: boolean;
  spacingInner: string;
  spacingOuter: string;
}

export type Printer = (
  val: any,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
) => string;
