---
title: "Encoding Icelandic name declension rules in 5kB"
description: ""
publishedAt: ""
---

Displaying personal names in Icelandic user interfaces is surprisingly hard. This is because of _declension_ -- a language feature that changes the form of words to communicate some syntatic function.

In Icelandic, there are four forms for every personal name. Take the name "Guðmundur":

{<table>
<tbody>
  <tr><th>Case</th><th>Form</th></tr>
  <tr><td>Nominative</td><td>Guðmundur</td></tr>
  <tr><td>Accusative</td><td>Guðmund</td></tr>
  <tr><td>Dative</td><td>Guðmundi</td></tr>
  <tr><td>Genitive</td><td>Guðmundar</td></tr>
</tbody>
</table>}

You always want to use the correct form. Using the wrong form results in a "broken" feel that native speakers associate with non-native speakers not yet fluent in the language.

The problem is that Icelandic personal names are always stored in the [nominative case][nom_case] (the nominative case can be thought of as the "default" case). If you've loaded a user from a database, their name will be in the nominative case.

[nom_case]: https://en.wikipedia.org/wiki/Nominative_case

This creates a problem when you have a sentence structure that requires, for example, the [accusative form][acc_case] of the name. As a developer, you can work around that by rewriting the sentence to use the nominative case, which can be _very_ awkward, or by using a pronoun (e.g. _they_). Both are unsatisfactory.

[acc_case]: https://en.wikipedia.org/wiki/Accusative_case

A few years ago, I went on a mission to solve this issue. The goal will be to create a JavaScript library that can be included on a web page to apply _any_ case to _any_ Icelandic name:

```ts
applyCase("Guðmundur", "accusative")
//=> "Guðmund"
```

A core concern will be to keep the bundle size tiny so that it doesn't blow up bundle sizes.


## Data for Icelandic names

Iceland has a publically run institution, [Árnastofnun][arnastofnun_en], that manages the [Database of Icelandic Morphology][dim] (DIM). The database was created, amongst other things, to support Icelandic language technology.

[arnastofnun_en]: https://www.arnastofnun.is/en
[dim]: https://bin.arnastofnun.is/DMII/

DIM publishes various [datasets][dim_datasets], but we'll use [Kristín's Format][k_format] (the K-format), downloadable as a CSV. Here's what the K-format data entries for "Guðmundur" look like:

```
Guðmundur;355264;kk;ism;1;;;;K;Guðmundur;NFET;1;;;
Guðmundur;355264;kk;ism;1;;;;K;Guðmund;ÞFET;1;;;
Guðmundur;355264;kk;ism;1;;;;K;Guðmundi;ÞGFET;1;;;
Guðmundur;355264;kk;ism;1;;;;K;Guðmundar;EFET;1;;;
```

<SmallNote label="">From this we can see that the name "Guðmundur" in the accusative (ÞFET) case is "Guðmund", and so on.</SmallNote>

From the K-format data, we can construct an array for each name containing its form in all cases.

```ts
[
  "Guðmundur", // Nominative
  "Guðmund",   // Accusative
  "Guðmundi",  // Dative
  "Guðmundar", // Genitive
]
```

[dim_datasets]: https://bin.arnastofnun.is/DMII/LTdata/
[k_format]: https://bin.arnastofnun.is/DMII/LTdata/k-format/

However, the K-format has data for most words in the Icelandic language, not just names. With over _7 million_ entries, this data set is huge. We'll need some way to whittle the list down.

Luckily for us, Iceland has the [Personal Names Register][icelandic_name_registry] that lists all Icelandic personal names approved (and rejected) by the Personal Name Committee (yes, that exists).

We can use the set of approved Icelandic names to filter the K-format data. Of the roughly 4,500 approved Icelandic names, the K-format has declension data for about 3,700. With that, we have declension data for most Icelandic names:

```ts
const NAME_FORMS = [
  [
    "Aðalberg",
    "Aðalberg",
    "Aðalberg",
    "Aðalbergs"
  ],
  [
    "Agnes",
    "Agnesi",
    "Agnesi",
    "Agnesar"
  ],
  // ...and roughly 3,700 more
]
```

[icelandic_name_registry]: https://island.is/en/search-in-icelandic-names

## Naive implementation

With the declension data in place, let's get to writing our library. The library will export a single <Ts method>applyCase</Ts> function takes a name in the nominative case and the grammatical case that the name should be returned in:

```ts
function applyCase(name, gCase) {
  // ...
}

applyCase("Guðmundur", "accusative")
//=> "Guðmund"
```

<SmallNote>Since `case` is a reserved word, we'll use <Ts>gCase</Ts> -- short for "grammatical case"</SmallNote>

The naive implementation would be to find the forms of the name:

```ts
const NAME_FORMS = [ ... ]

function applyCase(name, gCase) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
}
```

and the index of the form to return:

```ts
const CASES = ["nominative", "accusative", "dative", "genitive"];

function applyCase(name, gCase) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
  const caseIndex = CASES.indexOf(gCase);
}
```

With those in hand, we can return the form at <Ts>caseIndex</Ts> if <Ts>nameForms</Ts> was found for the input <Ts>name</Ts>, otherwise returning <Ts>name</Ts> as a fallback:

```ts
function applyCase(name, gCase) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
  const caseIndex = CASES.indexOf(gCase);
  return nameForms?.[caseIndex] || name;
}
```

This "works" but has major drawbacks, the first of which is bundle size. The <Ts>NAME_FORMS</Ts> list is about 256KB uncompressed and shrinks to 31KB when gzipped.

31KB is not terrible, but even if that were an acceptable bundle size for this library, this naive implementation only works for names in the <Ts>NAME_FORMS</Ts> list. As mentioned earlier, there are around 800 approved Icelandic names which would not be covered.

## Compressing the forms

We're currently storing the four different forms of each name in full. We can compact this by encoding the forms by storing the _root_ of the name with the suffixes of each form.

Consider the forms of "Guðmundur":

```
Guðmundur
Guðmund
Guðmundi
Guðmundar
```

The [root][root] (i.e. [longest common prefix][longest_common_prefix]) of the name is "Guðmund", and the suffixes are as follows:

```
<@blue>Guðmund</@> <@green>ur</@>
<@blue>Guðmund</@>
<@blue>Guðmund</@> <@green>i</@>
<@blue>Guðmund</@> <@green>ar</@>
<@blue>^^^^^^^</@> <@green>^^</@>
<@blue>Root</@>    <@green>Suffix</@>
```

[root]: https://en.wikipedia.org/wiki/Root_(linguistics)
[longest_common_prefix]: https://leetcode.com/problems/longest-common-prefix

We can encode this like so:

```ts
`${root};${suffixes.join(",")}`
```

Which for Guðmundur, gives us:

```
Guðmund;ur,,i,ar
```

That's more compact. Still, we can take this further. Since <Ts method>applyCase</Ts> receives the nominative case of the name as input we can store the length of nominative form's suffix, instead of the root, since we can derive the root from that.

```ts
function getRoot(nameNominative, suffixLength) {
  return nameNominative.slice(0, nameNominative.length - suffixLength);
}

getRoot("Guðmundur", 2)
//=> "Guðmund"
```

Storing the suffix length of the nominative form instead of the root gives us:

```
2;ur,,i,ar
```

This gives us a very compact way to encode the forms of a name. We'll call this the "forms encoding" from here on out.


## Retrieving encodings by name

When we were storing the raw forms in an array, it was very easy to find the forms of any given name:

```ts
NAME_FORMS.find(forms => forms[0] === name)
```

But the compact forms encoding doesn't encode the name itself, so we need a way to retrieve the encoding. The simplest method would be a plain hash map:

```ts
const nameToFormsEncoding = {
  Guðmundur: "2;ur,,i,ar",
  // ...3700 more lines
};
```

Aside from being inefficient in terms of bundle size, a hash map doesn't solve the problem of names not in the list of approved Icelandic names being excluded.

Here, one helpful fact that we can use is that words that have the same endings _tend_ to follow the same pattern of declension. These names, for example, all follow have the same forms encoding of <Ts>{'"2;ur,,i,ar"'}</Ts>:

```
Ástvaldur
Bárður
Freymundur
Ingimundur
Sigurður
Þórður
<@comment>// ...82 more</@>
```

There are, in fact, 88 approved Icelandic names with this exact pattern of declension, and they all end with _"ður"_ or _"dur"_.

The naive approach, then, would be to implement a <Ts method>getFormsEncoding</Ts> that encodes these patterns:

```ts
function getFormsEncoding(name) {
  if (name.endsWith("dur") || name.endsWith("ður")) {
    return "2;ur,,i,ar";
  }
  // ...
}
```

But that quickly breaks down. There are other names ending with _"ður"_ or _"dur"_ that follow a different pattern of declension:

* _"Aðalráður"_ and _"Arnmóður"_ have a forms encoding of <Ts>{'"2;ur,,i,s"'}</Ts>
* _"Baldur"_ has a forms encoding of <Ts>{'"2;ur,ur,ri,urs"'}</Ts>
* _"Hlöður"_ and _"Lýður"_ both have a forms encoding of <Ts>{'"2;ur,,,s"'}</Ts>

In fact, take a look at this [gist][names_by_forms_encoding] showing every approved Icelandic personal name grouped by their forms encoding. You'll immediately find distinct groups and patterns, but if you take a closer look you'll find numerous exceptions. Capturing all of these groups and exceptions in code would be a tedious and brittle affair.

[names_by_forms_encoding]: https://gist.github.com/alexharri/b35b40d27db664d6e0dcb9a2ac511090