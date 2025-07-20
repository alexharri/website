---
title: "Trie compression: Encoding Icelandic name declension rules in <5kB"
description: ""
publishedAt: ""
---

Displaying personal names in Icelandic user interfaces is surprisingly hard. This is because of _declension_ -- a language feature where the form of words change to communicate a syntatic function.

In Icelandic, there are four forms for every personal name. Take the name _"Guðmundur"_:

{<div className="table-1000"><table>
<tbody>
  <tr><th>Case</th><th>Form</th></tr>
  <tr><td>Nominative</td><td>Guðmundur</td></tr>
  <tr><td>Accusative</td><td>Guðmund</td></tr>
  <tr><td>Dative</td><td>Guðmundi</td></tr>
  <tr><td>Genitive</td><td>Guðmundar</td></tr>
</tbody>
</table></div>}

You always want to use the correct form. Using the wrong form results in a "broken" feel that native speakers associate with non-native speakers not yet fluent in the language.

The problem is that Icelandic personal names are always stored in the [nominative case][nom_case] (the nominative case can be thought of as the "default" case). If you've loaded a user from a database, their name will be in the nominative case.

[nom_case]: https://en.wikipedia.org/wiki/Nominative_case

This creates a problem when you have a sentence structure that requires, for example, the [accusative form][acc_case] of the name. As a developer, you can work around that by rewriting the sentence to use the nominative case, which can be _very_ awkward, or by using a pronoun (e.g. _they_). Both are unsatisfactory.

[acc_case]: https://en.wikipedia.org/wiki/Accusative_case

A few years ago, I created a JavaScript library to solve this issue. It applies any of the four grammatical case to Icelandic names:

```ts
applyCase("Guðmundur", "accusative")
//=> "Guðmund"
```

When building this library, I did not code _any_ rules by hand. Instead, the rules of name Icelandic declension are derived from public Icelandic data sources for personal names and their declension patterns. I store that data in a trie-like data structure that applies some clever compression techniques, resulting in a bundle size smaller than 5KB gzipped. This lets the library be included in web apps without increasing bundle size significantly.

The rest of this post is a deep dive into the problem, and the compression techniques I used to solve it.


## Data for Icelandic name declension

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

From the K-format data, we can construct an array for each name containing its form for each grammatical case:

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
function applyCase(name, grammaticalCase) {
  // ...
}

applyCase("Guðmundur", "accusative")
//=> "Guðmund"
```

The naive implementation would be to find the forms of the name:

```ts
const NAME_FORMS = [ ... ]

function applyCase(name, grammaticalCase) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
}
```

and the index of the form to return:

```ts
const CASES = ["nominative", "accusative", "dative", "genitive"];

function applyCase(name, grammaticalCase) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
  const caseIndex = CASES.indexOf(grammaticalCase);
}
```

With those in hand, we can return the form at <Ts>caseIndex</Ts> if <Ts>nameForms</Ts> was found for the input <Ts>name</Ts>, otherwise returning <Ts>name</Ts> as a fallback:

```ts
function applyCase(name, grammaticalCase) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
  const caseIndex = CASES.indexOf(grammaticalCase);
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

This gives us a very compact way to encode the forms of a name. We'll call this the "forms encoding", or just "encoding", from here on.


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

Here, one helpful fact about Icelandic declension is that names with similar suffixes _tend_ to follow the same pattern of declension. These names ending in _"ur"_ all have the same forms encoding of <Ts>{'"2;ur,,i,ar"'}</Ts>:

```
Ástvaldur
Bárður
Freymundur
Ingimundur
Sigurður
Þórður
```

There are, in fact, 88 approved Icelandic names with this exact pattern of declension, and they all end with _"ður"_, _"dur"_ or "_tur_".

The naive approach, then, would be to implement a <Ts method>getFormsEncoding</Ts> function that encodes these patterns:

```ts
function getFormsEncoding(name) {
  if (/(d|ð|t)ur$/.test(name)) {
    return "2;ur,,i,ar";
  }
  // ...
}
```

But that quickly breaks down. There are other names ending with _"ður"_ or _"dur"_ that follow a different pattern of declension:

* _"Aðalráður"_ and _"Arnmóður"_ have a forms encoding of <Ts>{'"2;ur,,i,s"'}</Ts>
* _"Baldur"_ has a forms encoding of <Ts>{'"2;ur,ur,ri,urs"'}</Ts>
* _"Hlöður"_ and _"Lýður"_ both have a forms encoding of <Ts>{'"2;ur,,,s"'}</Ts>

In fact, take a look at this [gist][names_by_forms_encoding] showing every approved Icelandic personal name grouped by their forms encoding (there are 124 unique encodings). You'll immediately find patterns, but if you take a closer look you'll find numerous counterexamples to those patterns. Capturing all of these rules and their exceptions in code would be a tedious and brittle affair.

[names_by_forms_encoding]: https://gist.github.com/alexharri/b35b40d27db664d6e0dcb9a2ac511090

Instead of trying to code up the rules manually, we can use a data structure that lends itself perfectly to this problem. That data structure is the _trie_. Let's see how.


## Tries

The [trie][trie] data structure, also know as a prefix tree, is a tree data structure that maps string keys to values. In tries, each character in the key becomes a node in the tree that points to the previous character (or the root in the case of the first character).

Take for example the name _"Heimir"_, which has a forms encoding of <Ts>{'"1;r,,,s"'}</Ts>. If inserted into a trie, the trie becomes:

<Image plain src="~/heimir-trie.svg" minWidth={620} width={680} />

Let's insert _"Heiðar"_ to the trie, which has a forms encoding of <Ts>{'"1;r,,i,s"'}</Ts>. The names share the first three characters, so they share the first three nodes in the trie:

<Image plain src="~/heimir-heidar-trie.svg" minWidth={620} width={680} />

[trie]: https://en.wikipedia.org/wiki/Trie

Retrieving a value from a trie is simple. We'll define a <Ts method>trieLookup</Ts> that takes the trie's <Ts>root</Ts> node and a <Ts>key</Ts> to look up:

```ts
interface TrieNode {
  children?: { [key: string]: TrieNode };
  value?: string;
}

function trieLookup(root: TrieNode, key: string) {
  // ...
}
```

For each character in the key, we'll traverse to the child <Ts>node</Ts> for that character, stopping if no such <Ts>node</Ts> exists:

```ts
let node: TrieNode | undefined = root;

for (const char of key) {
  node = node.children?.[char];
  if (!node) {
    break;
  }
}
```

We return the value of the resulting <Ts>node</Ts>, if present

```ts
return node?.value;
```

giving us the following implementation:

```ts
interface TrieNode {
  children?: { [key: string]: TrieNode };
  value?: string;
}

function trieLookup(root: TrieNode, key: string) {
  let node: TrieNode | undefined = root;
  for (const char of key) {
    node = node.children?.[char];
    if (!node) {
      break;
    }
  }
  return node?.value;
}
```


## Grouping keys by suffix

I mentioned earlier that names with similar suffixes tend to have similar form encodings. Because of that, it makes more sense to insert names _backwards_. Doing that results in all names sharing any given suffix existing within the same subtree.

Consider the following names that end with _"ur"_ and their encodings:

```
<@blue>Ylfur</@><@text400>:</@>   <@green>2;ur,i,i,ar</@>
<@blue>Knútur</@><@text400>:</@>  <@green>2;ur,,i,s</@>
<@blue>Hrútur</@><@text400>:</@>  <@green>2;ur,,i,s</@>
<@blue>Loftur</@><@text400>:</@>  <@green>2;ur,,i,s</@>

<@blue>Name</@>     <@green>Forms encoding</@>
```

Here's the trie we get from inserting each of them _backwards_ into the trie:

<Image plain src="~/ur-divergence.svg" minWidth={620} width={680} />

The first two nodes, `r->u`, are shared for all four names, but the tree diverges after that.

## Compressing the trie

Notice how every leaf in the subtree `r->u->t` has the same value of <Ts>{'"2;ur,,i,s"'}</Ts>:

<Image plain src="~/ur-divergence.svg" minWidth={620} width={680} />

When every leaf in a subtree has a common value, we can _compress_ the subtree. We do that by setting the value of the subtree's root to the value of its leaves, and then deleting every child of the root.

Let's quickly implement a recursive <Ts method>compress</Ts> function that performs this operation:

```ts
function compress(node: TrieNode): string | null
```

The <Ts method>compress</Ts> function will return <Ts>null</Ts> and do nothing if <Ts>node</Ts>'s children do not have a common value. If they _do_ share a common value, it will delete all of it's children and assign their common value to itself.

The first step is to collect its childrens' common values by invoking <Ts method>compress</Ts> recursively, using a [depth-first][dfs] traversal:

```ts
const values = Object.values(node.children).map(compress);
values.push(node.value);
```

[dfs]: https://en.wikipedia.org/wiki/Depth-first_search

After that, return null if there is not a common value:

```ts
if (new Set(values).size !== 1 || values[0] == null) {
  return null;
}
```

Otherwise, assign the common value to <Ts>node</Ts>, remove the children, and return the common value.

```ts
node.value = values[0];
node.children = {};
return node.value;
```

This gives us:

```ts
function compress(node: TrieNode) {
  const values = Object.values(node.children).map(compress);
  values.push(node.value);

  if (new Set(values).size !== 1 || values[0] == null) {
    return null;
  }

  node.value = values[0];
  node.children = {};
  return node.value;
}
compress(root);
```

Here's the trie from above, compressed:

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

Compressing the trie reduced the number of nodes by more than half and the encodings are no longer repeated.


## Lookups in the compressed trie

When we originally inserted _"Ylfur"_ into the trie, we created the path `r->u->f->l->Y`. However, after compressing the trie, only the `r->u->f` part of that path remains:

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

This means that our <Ts method>trieLookup</Ts> function from earlier will return <Ts>null</Ts>:

```ts
function trieLookup(root: TrieNode, key: string) {
  let node: TrieNode | undefined = root;
  for (const char of reverse(key)) {
    node = node.children?.[char];
    // @info {w=4} 'node' will be null for 'f->l'
    if (!node) {
      break;
    }
  }
  return node?.value;
}
```

<SmallNote><Ts>reverse(key)</Ts> is new. It became necessary once we started inserting names into the trie backwards.</SmallNote>

We can fix that by returning the value of the last node we encountered:

```ts
function trieLookup(root: TrieNode, key: string) {
  let node = root;
  for (const char of reverse(key)) {
    const next = node.children?.[char];
    if (!next) {
      break;
    }
    node = next;
  }
  return node.value;
}
```

So consider our trie again:

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

We will get <Ts>{'"2;ur,i,i,ar"'}</Ts> for all lookup keys matching `*fur` and <Ts>{'"2;ur,,i,s"'}</Ts> for all keys matching `*tur`.

```ts
trieLookup(trie, "Ylfur")
//=> "2;ur,i,i,ar"

trieLookup(trie, "Knútur")
//=> "2;ur,,i,s"

trieLookup(trie, "Hrútur")
//=> "2;ur,,i,s"

trieLookup(trie, "Loftur")
//=> "2;ur,,i,s"
```

As we can see above, when we look up the original four input keys that we inserted into the trie, we get the expected value. However, we _also_ get values for lookup keys _not_ in the original input data:

```ts
trieLookup(trie, "Bjartur")
//=> "2;ur,,i,s"
```

This was _not_ the case prior to compressing the trie. Only the original input keys would have returned a value.

### Handling unknown keys

In the case of _"Bjartur"_, the encoding <Ts>{'"2;ur,,i,s"'}</Ts> is, in fact, the [correct][bjartur] encoding. Still, it may not be obvious that returning values for keys not in the original input data is desirable. I'll discuss that more in a bit.

[bjartur]: https://bin.arnastofnun.is/beyging/353882

Consider keys that do not follow a pattern that the trie has a seen before. For this trie, that would be keys that match `*ur` but don't match `*(t|f)ur`.

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

_"Sakur"_ is one such key. During that key's lookup, the last hit <Ts>node</Ts> is the `u` node at `r->u`. The `u` node has no value, so <Ts method>trieLookup</Ts> returns <Ts>null</Ts> for _"Sakur"_:

```ts
trieLookup(trie, "Sakur")
//=> null
```

I'd consider _"Sakur"_ returning <Ts>null</Ts> to be a good thing.

If every name in the trie's input data ending in `*ur` resolved to the same value, then _"Sakur"_ should resolve to that value. However, not every name that ends in `*ur` maps to the same value. There's a divergence. The keys ending in `*tur` resolve to one value, but keys ending in `*fur` resolve to another, creating ambiguity for keys matching neither.

In the case of such ambiguity, at maximum one of the branches resolves to the correct value, and in many cases, none of the branches resolve to the correct value. The natural conclusion, then, is to _not_ return a value.

## Quantifying subtree compression

Let's get a sense of the degree of compression we get from merging subtrees with common values.

Inserting every approved Icelandic name that we have declension data for into the trie gives us an uncompressed trie with 10,284 nodes, 3,638 of which are leaves. As a reminder, the name is the key and the forms encoding the value.

Merging subtrees with common values reduces the total number of nodes to 1,588. Of those 1,261 are leaves and 327 are not.

{<table data-align="right">
<tbody>
    <tr><th></th><th>Uncompressed</th><th>Compressed</th><th>Compressed as % of uncompressed</th></tr>
    <tr><td className="align-left">Total nodes</td><td>10,284</td><td>1,588</td><td>15.4%</td></tr>
    <tr><td className="align-left">Non-leaf nodes</td><td>6,646</td><td>327</td><td>4.9%</td></tr>
    <tr><td className="align-left">Leaf nodes</td><td>3,638</td><td>1,261</td><td>34.6%</td></tr>
</tbody>
</table>}

6,319 non-leaf nodes were removed, which is __over 95%__. The removal of so many non-leaf nodes must mean that the paths from the root to the leaf nodes got significantly shorter.

Let's see how much shorter — here's a chart showing the traversal depth of lookups for the keys in the input data, both for the uncompressed and compressed tries:

<BarChart data="depth-count-weighted" width={500} minWidth={280} height={300} minHeight={200} disableNormalization />

This is a significant drop in lookup depths -- the lookup depth for the _majority_ of names in the original input data is now three or lower.

### Can we trust values returned by the compressed trie?

When considering how short of a suffix match is required for a value to be returned from the trie, a natural question arises: how often will the trie return values that are incorrect?

Consider the trie from earlier, which we constructed from only four names:

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

If we look up the name _"Leifur"_, we hit the <Node>r->u->f</Node> node so the <Ts>{'"2;ur,i,i,ar"'}</Ts> encoding is returned. That is [not][leifur] the correct encoding for Leifur.

[leifur]: https://bin.arnastofnun.is/leit/Leifur

Still, that's just because our trie was only created using declension data for four names ending in `*ur`. In the K-format data there are 648 approved Icelandic personal names that match `*ur` (67 of which match `*fur`).

Here's the compressed trie built from the declension data for _all_ names ending in `*fur`:

<Image plain src="~/fur-trie.svg" minWidth={630} width={630} />

<SmallNote center>I've hidden the full `*lfur` subtree to simplify this view.</SmallNote>

Looking up _"Leifur"_ in this trie hits the <Node>r->u->f->i</Node> node, returning an encoding of <Ts>{'"2;ur,,i,s"'}</Ts>, which _is_ correct. There are, in fact, 21 names that end in _"ifur"_, and all of them have an encoding of <Ts>{'"2;ur,,i,s"'}</Ts> which enabled the compression of the <Node>r->u->f->i</Node> subtree.

The correct encoding is returned for _"Leifur"_, sure, but that doesn't tell us much about the correctness of the full compressed trie for names it hasn't encountered before.

### Testing the trie on not-before-seen names

Since not-before-seen names, by definition, don't have declension data available for them, I went ahead and manually reviewed results.

The list of approved Icelandic names that don't have declension data gives us roughly 800 names to work with. I wrote a function to pick 100 of those names at random categorized the results. Here they are:

{<table className="nowrap" data-align="right">
<tbody>
    <tr><th>Result</th><th>Count</th></tr>
    <tr><td className="align-left">Perfect (declension applied)</td><td>62</td></tr>
    <tr><td className="align-left">Perfect (no declension applied)</td><td>12</td></tr>
    <tr><td className="align-left">Should have applied declension</td><td>23</td></tr>
    <tr><td className="align-left">Wrong, should not be declined</td><td>2</td></tr>
    <tr><td className="align-left">Wrong declension</td><td>1</td></tr>
</tbody>
</table>}

This gives us a rough indication that, for not-before-seen names, the full compressed trie gives us a good or neutral result 97% of the time. The _"Should have applied declension"_ case results in <Ts method>applyCase</Ts> not applying declension to the name and returning it as-is, which I'd consider a neutral result. 3% of the results are incorrect.

But still, these are just 100 random names. Some names are far more common than other so it'd be interesting to see how well the compressed trie performs for the most common names.

Luckily for us, [Statistics Iceland][statice] publishes data on [how many individuals have specific names][names]. Using this data, I created the chart below. It shows the number of people holding each name in the approved names list as a first name. Names covered by DIM are colored blue while names not covered are colored red:

[names]: https://statice.is/statistics/population/births-and-deaths/names/

[statice]: https://www.statice.is/

<BarChart data="names-count" width={1200} minWidth={800} height={400} minHeight={375} logarithmic toggleLogarithmic />

<SmallNote>Since relatively few names dominate this list, I made the chart logarithmic by default. You can use the toggle to see the non-logarithmic chart.</SmallNote>

363,314 people hold a name from the approved list of Icelandic names as a first name. Of those, 5,833 have names that don't have declension data available.

As we can see from the chart, the commonality of names is far from evenly distributed. In fact, the top 100 names not covered by the DIM data covers 4,990 people (about 86%). I went ahead and categorized the declension results for those 100 names. Here are the results:

{<table className="nowrap" data-align="right">
<tbody>
    <tr><th>Result</th><th>Count</th></tr>
    <tr><td className="align-left">Perfect (declension applied)</td><td>3,489</td></tr>
    <tr><td className="align-left">Perfect (no declension applied)</td><td>440</td></tr>
    <tr><td className="align-left">Should have applied declension</td><td>915</td></tr>
    <tr><td className="align-left">Wrong, should not be declined</td><td>101</td></tr>
    <tr><td className="align-left">Wrong declension</td><td>45</td></tr>
    <tr><td className="align-left">Total</td><td>4,990</td></tr>
</tbody>
</table>}

The error rate here is 2.9%. If we extrapolate that 2.9% error rate across the 5,833 people not covered by DIM data we get 170 wrong results. So for the 363,314 people holding names in the approved list of Icelandic names, that corresponds to an error rate of __0.046%__.

## Regularity and comprehensiveness

As we can see, the compressed trie captures the rules of Icelandic name declension to an impressive degree. I believe this is due to the _regularity_ and _comprehensiveness_ of the data on Icelandic name declension, where

 * _regularity_ is the degree to which similar key suffixes map to the same values, and
 * _comprehensiveness_ is how well the input data captures rules _and_ exceptions to them.

### Regularity

If the input data were _irregular_ -- meaning that there's no significant relationship between suffixes and associated values -- the values of leaves in subtrees would frequently differ. That would prevent subtree compression, resulting in not-very-compressed trie that is similar, if not identical, to the original trie. The less a trie is compressed, the longer the suffix match needs to be for a value to be returned.

The opposite happens as the input data becomes more regular. Subtrees will be more frequently compressed, leading to shorter suffix matches being required for values to be returned. Shorter matches leads to more lookups returning values. In the extreme, a fully compressed trie will _always_ return the same value for all lookup keys.

### Comprehensiveness

Subtrees are only ever incorrectly compressed if the original trie lacks a counterexample to the regularity that led to compression. If a counterexample had been present, it would have prevented compression and created an exception to the rule.

If we pick, say, 450 Icelandic names at random, we will capture many of the rules of Icelandic name declension, and some counterexamples to them. Still, 450 names is only 10% of approved Icelandic names, so we can expect loads of declension rules _not_ to be covered by that sample.

But with 3,700 samples, like in our case, we have over 80% coverage. With data that comprehensive, the compressed trie captures the rules, and exceptions to those rules, incredibly well.

## Merging sibling leaves with common suffixes

You might have noticed an opportunity for optimization in this graph from earlier:

<Image plain src="~/fur-trie.svg" minWidth={560} width={560} />

The <Node>i</Node>, <Node>ó</Node>, <Node>ú</Node>, <Node>a</Node> sibling leaves following <Node>r->u->f</Node> all resolve to the same value of <Ts>{'"2;ur,,i,s"'}</Ts>, but the <Node>l</Node> and <Node>i</Node> nodes have leaves with different values, which prevented the <Node>r->u->f</Node> subtree from being compressed.

What we can do here is merge sibling leaves with common values. That results in the <Node>i</Node>, <Node>ó</Node>, <Node>ú</Node>, <Node>a</Node> leaves being merged into a single <Node>ióúa</Node> leaf node:

<Image plain src="~/fur-trie-leaves-merged.svg" minWidth={560} width={560} />

This reduces repetition, but we need to consider this case in our <Ts method>trieLookup</Ts> function. We can do that like so:

```ts
function findChild({ children }: TrieNode, char: string) {
  for (const [childKey, child] of Object.entries(children)) {
    if (childKey.includes(char)) {
      return child
    }
  }
}

function trieLookup(root: TrieNode, key: string) {
  let node = root;
  for (const char of reverse(key)) {
    const next = findChild(node, char);
    if (!next) {
      break;
    }
    node = next;
  }
  return node.value;
}
```

It's worth mentioning that, unlike merging subtrees with common values, merging sibling leaves has no functional effect on the trie. This layer of compression is purely to make the trie's footprint smaller.


## Savings from merging sibling leaves

Here is the node count table from before, with a new column that shows the results for the trie that has also had its sibling leaves merged:

{<table data-align="right">
<tbody>
    <tr><th></th><th>Uncompressed</th><th>Only subtrees merged</th><th>Subtrees and sibling leaves merged</th></tr>
    <tr><td className="align-left">Total nodes</td><td>10,284</td><td>1,588</td><td>972</td></tr>
    <tr><td className="align-left">Non-leaf nodes</td><td>6,646</td><td>327</td><td>327</td></tr>
    <tr><td className="align-left">Leaf nodes</td><td>3,638</td><td>1,261</td><td>645</td></tr>
</tbody>
</table>}

Merging sibling leaf nodes with common values almost cuts the number of leaf nodes in half! Since we're only touching the leaf nodes, the number of non-leaf nodes stays the same. Lookup depth is also not effected.

One interesting statistic is how many names in the original input data each leaf node now represents. Here are the top 50 leaf nodes by the number of names it represents:

<BarChart data="leaf-key-count" width={540} minWidth={400} height={1000} minHeight={300} horizontal />

The top node <Node>i->bdfjklmnpstvxðóú</Node> is the result of merging 166 leaf nodes. That indicates that Icelandic names ending in _"i"_ exhibit a high regularity in their pattern of declension. Let's take a closer look at the <Node>i</Node> subtree:

<Image plain src="~/i-trie.svg" minWidth={720} width={800} />
<SmallNote label="" center>Next to each value node, I've added the number of names that the leaf node represents in parentheses.</SmallNote> 

The <Node>i</Node> subtree is built from declension data for 223 names. Only four of those names don't follow the declension pattern of <Ts>{'"1;i,a,a,a"'}</Ts>. That's a really high degree of regularity! Those four names serve as important counterexamples to the general rule that names ending in _"i"_ have a forms encoding of <Ts>{'"1;i,a,a,a"'}</Ts>. Without them the <Node>i</Node> subtree would have been compressed to a single value node.

