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
    T extends `{${infer Content}}`
    ? ParseObject<`{${Content}}`>
    : // Default to primitives if neither array nor object
      ParsePrimitive<T>;

type ParseObject<T> = T extends `{${infer Content}}`
  ? MergeArrayOfObjects<ParseProperties<SplitProperties<Content>>>
  : never;

type T1 = ParseObject<`{a?:number}`>;
