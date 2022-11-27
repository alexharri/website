/**
 * Copyright 2022 Alex Harri Jónsson <alexharri2919@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

type ParsePrimitive<T> = T extends "string"
  ? string
  : T extends "number"
  ? number
  : T extends "boolean"
  ? boolean
  : never;

type MergeArrayOfObjects<T> = T extends [infer R, ...infer Rest]
  ? R & MergeArrayOfObjects<Rest>
  : {};

type SplitString<
  T,
  Split extends string
> = T extends `${infer Before}${Split}${infer After}`
  ? [Before, ...SplitString<After, Split>]
  : [T];

type BalanceBrackets<T extends string[]> = T extends [
  infer Curr extends string,
  infer Next extends string,
  ...infer Rest extends string[]
]
  ? AreBracketsBalanced<Curr> extends true
    ? // Process next item
      [Curr, ...BalanceBrackets<[Next, ...Rest]>]
    : // Merge the next item with the current item and recursively
      // process the merged item
      BalanceBrackets<[`${Curr};${Next}`, ...Rest]>
  : T;

type StringToTuple<T extends string> = T extends `${infer Char}${infer Rest}`
  ? [Char, ...StringToTuple<Rest>]
  : [];

type FilterTuple<T extends any[], U> = T extends [infer Item, ...infer Rest]
  ? Item extends U
    ? [Item, ...FilterTuple<Rest, U>]
    : FilterTuple<Rest, U>
  : [];

type InstancesInString<T extends string, Char> = FilterTuple<
  StringToTuple<T>,
  Char
>["length"];

type AreBracketsBalanced<T extends string> = InstancesInString<
  T,
  "{"
> extends InstancesInString<T, "}">
  ? true
  : false;

type SplitProperties<T extends string> = BalanceBrackets<SplitString<T, ";">>;

type RemoveSpaces<T extends string> = T extends `${infer L} ${infer R}`
  ? RemoveSpaces<`${L}${R}`>
  : T;

type RemoveTabs<T extends string> = T extends `${infer L}\t${infer R}`
  ? RemoveTabs<`${L}${R}`>
  : T;

type RemoveNewlines<T extends string> = T extends `${infer L}\n${infer R}`
  ? RemoveNewlines<`${L}${R}`>
  : T;

export type RemoveWhitespace<T extends string> = RemoveSpaces<
  RemoveTabs<RemoveNewlines<T>>
>;

type ParseProperties<T extends string[]> = {
  [K in keyof T]: ParseProperty<T[K]>;
};

type ParseProperty<T extends string> = KeyValue<T> extends {
  key: infer K extends string;
  value: infer V;
}
  ? { [key in K]: V }
  : never;

type KeyValue<T extends string> = T extends `${infer K}:${infer V}`
  ? K extends `${infer KeyWithoutQuestionmark}?`
    ? {
        key: KeyWithoutQuestionmark;
        value: ParseValue<V> | null;
      }
    : {
        key: K;
        value: ParseValue<V>;
      }
  : never;

type ParseValue<T> =
  // Match array notation
  T extends `${infer Before}[]`
    ? ParseValue<Before>[]
    : // Match object
    T extends `{${string}}`
    ? ParseObject<T>
    : // Default to primitives if neither array nor object
      ParsePrimitive<T>;

type ParseObject<T> = T extends `{${infer Content}}`
  ? MergeArrayOfObjects<ParseProperties<SplitProperties<Content>>>
  : never;

// @ts-ignore
type Parse<T extends string> = ParseObject<RemoveWhitespace<T>>;
