/**
 * Copyright 2019 Pierre-Antoine Mills
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Based on the 'Compute' type from https://github.com/millsp/ts-toolbelt

type __Key = string | number | symbol;

type __Boolean = 0 | 1;

type __Has<U extends any, U1 extends any> = [U1] extends [U] ? 1 : 0;

type __Depth = "flat" | "deep";

type __BuiltIn =
  | Function
  | Error
  | Date
  | { readonly [Symbol.toStringTag]: string }
  | RegExp
  | Generator;

type __If<B extends __Boolean, Then, Else = never> = B extends 1 ? Then : Else;

type __ComputeFlat<A extends any> = A extends __BuiltIn
  ? A
  : A extends Array<any>
  ? A extends Array<Record<__Key, any>>
    ? Array<{ [K in keyof A[number]]: A[number][K] } & unknown>
    : A
  : A extends ReadonlyArray<any>
  ? A extends ReadonlyArray<Record<__Key, any>>
    ? ReadonlyArray<{ [K in keyof A[number]]: A[number][K] } & unknown>
    : A
  : { [K in keyof A]: A[K] } & unknown;

type __ComputeDeep<A extends any, Seen = never> = A extends __BuiltIn
  ? A
  : __If<
      __Has<Seen, A>,
      A,
      A extends Array<any>
        ? A extends Array<Record<__Key, any>>
          ? Array<{ [K in keyof A[number]]: __ComputeDeep<A[number][K], A | Seen> } & unknown>
          : A
        : A extends ReadonlyArray<any>
        ? A extends ReadonlyArray<Record<__Key, any>>
          ? ReadonlyArray<
              { [K in keyof A[number]]: __ComputeDeep<A[number][K], A | Seen> } & unknown
            >
          : A
        : { [K in keyof A]: __ComputeDeep<A[K], A | Seen> } & unknown
    >;

declare type __Compute<A extends any, depth extends __Depth = "deep"> = {
  flat: __ComputeFlat<A>;
  deep: __ComputeDeep<A>;
}[depth];
