---
title: "Trie compression: Encoding Icelandic name declension rules in <5kB"
description: ""
publishedAt: ""
---

Displaying personal names in Icelandic user interfaces is surprisingly hard. This is because of _declension_ -- a language feature that changes the form of words to communicate a syntatic function.

In Icelandic, there are four forms for every personal name. Take the name _"Guðmundur"_:

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

Here, one helpful fact that we can use is that words that have the same suffixes _tend_ to follow the same pattern of declension. These names, for example, all follow have the same forms encoding of <Ts>{'"2;ur,,i,ar"'}</Ts>:

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

In fact, take a look at this [gist][names_by_forms_encoding] showing every approved Icelandic personal name grouped by their forms encoding (there are 124 unique encodings). You'll immediately find distinct groups and patterns, but if you take a closer look you'll find numerous exceptions. Capturing all of these groups and exceptions in code would be a tedious and brittle affair.

[names_by_forms_encoding]: https://gist.github.com/alexharri/b35b40d27db664d6e0dcb9a2ac511090

Instead of trying to code up the rules manually, we can use a data structure that lends itself perfectly to this problem. That data structure is the _trie_. Let's see how.


## Tries

The [trie][trie] data structure, also know as a prefix tree, is a tree data structure that maps string keys to values. In tries, each character in the key becomes a node in the tree that points to the previous character (or the root in the case of the first character).

Take for example the name _"Heimir"_, which has a forms encoding of <Ts>{'"1;r,,,s"'}</Ts>. If inserted into a trie, the trie becomes:

<Image plain src="~/heimir-trie.svg" minWidth={620} width={680} />

Let's insert _"Heiðar"_ to the trie, which has a forms encoding of <Ts>{'"1;r,,i,s"'}</Ts>. The names share the first three characters, so they share the first three nodes in the trie:

<Image plain src="~/heimir-heidar-trie.svg" minWidth={620} width={680} />

[trie]: https://en.wikipedia.org/wiki/Trie

Retrieving a value from a trie is simple -- let's define a <Ts method>trieLookup</Ts> that takes a trie <Ts>root</Ts> node and a <Ts>key</Ts> to look up:

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

We'll return the value of the resulting <Ts>node</Ts>, if present

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

We'll look at how to construct tries later. For now I want to make tries work for _our use case_ of retrieving the encodings for names.


## Compressing the trie

I mentioned earlier that names with similar suffixes tend to have similar form encodings. Because of that, inserting names _backwards_ unlocks some optimizations we can make.

Consider the following names that end with _"ur"_ and their encodings:

```
<@blue>Ylfur</@><@text400>:</@>   <@green>2;ur,i,i,ar</@>
<@blue>Knútur</@><@text400>:</@>  <@green>2;ur,,i,s</@>
<@blue>Hrútur</@><@text400>:</@>  <@green>2;ur,,i,s</@>
<@blue>Loftur</@><@text400>:</@>  <@green>2;ur,,i,s</@>

<@blue>Name</@>     <@green>Forms encoding</@>
```

Here's the trie we get by inserting each of these _backwards_ into the trie:

<Image plain src="~/ur-divergence.svg" minWidth={620} width={680} />

The first two nodes -- `r->u` -- are shared for all four names, but the tree diverges after that. But consider the subtree of `r->u->t`. Every leaf in that subtree has the same value of <Ts>{'"2;ur,,i,s"'}</Ts>.

When every leaf in a subtree has a common value, we can compress the subtree. We do that by setting the value of the subtree's root to the value of its leaves, and then deleting every child of the root. We can perform that operation like so:

```ts
function compress(root: TrieNode) {
  function dfs(node: TrieNode): string | null {
    const values = Object.values(node.children).map(dfs);

    if (node.value != null) {
      values.push(node.value);
    }

    if (new Set(values).size !== 1 || values[0] == null) {
      // Value is not same for every leaf
      return null;
    }

    // All leaves have same value so compress subtree
    node.value = values[0];
    node.children = {};
    return node.value;
  }
  dfs(root);
}
```

Here's the trie from above, compressed:

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

It's _far_ smaller. Compressing the trie reduced the number of nodes by more than half. The encodings are no longer repeated.


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

<SmallNote>The <Ts>reverse(key)</Ts> expression is new. It became necessary once we started inserting names into the trie backwards.</SmallNote>

We can fix that by returning the value of the last node:

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

We will get <Ts>{'"2;ur,i,i,ar"'}</Ts> for all keys matching `*fur` and <Ts>{'"2;ur,,i,s"'}</Ts> for all keys matching `*tur`.

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

As we can see above, when we look up the original four names that we inserted into the trie, we get the expected value. We _also_ get values for keys _not_ in the original trie:

```ts
trieLookup(trie, "Bjartur")
//=> "2;ur,,i,s"
```

In the case of _"Bjartur"_, the encoding <Ts>{'"2;ur,,i,s"'}</Ts> is, in fact, the [correct][bjartur] encoding. Still, it may not be obvious that this is desirable. I'll discuss that more in a bit.

[bjartur]: https://bin.arnastofnun.is/beyging/353882

Now, consider keys that do not follow a pattern that the trie has a seen before. For this trie, that would be keys that match `*ur` but don't match `*(t|f)ur` (neither `*tur` nor `*fur`).

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

<Ts>{'"Sakur"'}</Ts> is one such key. During that key's lookup, the last hit <Ts>node</Ts> is the `u` node at `r->u`. The `u` node has no value, so <Ts method>trieLookup</Ts> returns <Ts>null</Ts> for <Ts>{'"Sakur"'}</Ts>:

```ts
trieLookup(trie, "Sakur")
//=> null
```

Let's consider why <Ts>{'"Sakur"'}</Ts> returning <Ts>null</Ts> is a good thing.

If every name in the trie's input data that ended in `*ur` resolved to the same value, then <Ts>{'"Sakur"'}</Ts> should resolve to that value.

However, not every name that ends in `*ur` maps to the same value. There's a divergence. The keys ending in `*tur` resolve to one value, but keys ending in `*fur` resolve to another, creating ambiguity for keys matching neither.

In the case of such ambiguity, we have two or more branches that we can choose from. Since the branches resolve to different values, at maximum one of the branches resolves to the correct value (and in many cases, none of the branches are correct).

Given this, the natural conclusion in the case of ambiguity is to _not_ return a value.

## Can we trust values that _are_ returned?

But what about names that match a branch but are not in the original input data? Take <Ts>{'"Leifur"'}</Ts> as an example.

<Image plain src="~/ur-divergence-merged.svg" minWidth={470} width={470} />

Leifur hits the `r->u->f` path so the <Ts>{'"2;ur,i,i,ar"'}</Ts> encoding is returned. This is actually the [_incorrect_ encoding for Leifur][leifur].

[leifur]: https://bin.arnastofnun.is/leit/Leifur

That seems to indicate that we can't really trust the compressed trie to consistently return correct values for names. However, the real dataset contains _far_ more names than just four. There are 648 approved Icelandic personal names that match `*ur`, and 67 that match `*fur`.

Let's analyse this case a bit better by looking at the compressed trie for all names ending `*fur`.

<Image plain src="~/fur-trie.svg" minWidth={560} width={560} />

<SmallNote center>I've hidden the full `*lfur` subtree to simplify this view.</SmallNote>

Looking up _"Leifur"_ in this trie hits the `r->u->f->i` node, returning an encoding of <Ts>{'"2;ur,,i,s"'}</Ts>, which _is_ correct. There are, in fact, 21 names that end in _"ifur"_, and all of them have an encoding of <Ts>{'"2;ur,,i,s"'}</Ts> which enabled the compression of the `r->u->f->i` subtree.

So for the question

> _Can we trust values returned by the the compressed trie?_

the answer depends to which degree the input data exhibits the following two characteristics:

 * _Comprehensiveness_ — how well the input data captures rules _and_ exceptions to them.
 * _Regularity_ — the degree to which similar key suffixes map to the same values.

Let's analyze that a bit.

## Regularity and comprehensiveness

If the input data were _irregular_ -- meaning that there's no significant relationship between suffixes and associated values -- the values of leaves in subtrees would frequently differ. That would prevent subtree compression, resulting in not-very-compressed trie that is similar, if not identical, to the original trie. The less a trie is compressed, the longer the suffix match needs to be for a value to be returned.

A fully uncompressed trie will _never_ return a value for lookup keys not in the input data.

The opposite happens as the input data becomes more _regular_. Subtrees will be more frequently compressed, leading to shorter suffix matches being required for values to be returned. Shorter matches leads to more lookups returning values, whether those values are correct or not.

A fully compressed trie will _always_ return the same value for all lookup keys.

Now, the whole point of the compressed trie is to capture the rules in data that is fairly regular, but not completely. If a dataset is either fully regular, or not regular at all, a compressed trie is not a good fit. Icelandic name declension is a great fit since similar name suffixes tend to follow similar patterns of declension.

Let's now consider comprehensiveness. If we pick 5 Icelandic names at random, we may get a sample that is perfectly irregular, leading to a fully uncompressed trie. We might also get a sample where every name follows the same pattern of declension, leading to a fully compressed trie.

If we increases the sample to 450 names, we will definitely see patterns emerge. Depending on chance, we might see many counterexamples to the patterns in our sample, but we might happen to see few. With a total of 4,500 approved Icelandic names, I'd expect a sample of 450 to capture the rules of the most common Icelandic names, but I'd expect lots of incorrect values. The sample of 450 is not comprehensive enough.

But with 3,700 samples, like in our case, we have over 80% coverage. With data that comprehensive, the data captures the rules, and counterexamples to those rules, incredibly well.

Subtrees are only ever incorrectly compressed if the original trie lacks a counterexample to the regularity that led to compression. If a counterexample were present, it would have prevented compression. As comprehensiveness increases, so does the number of counterexamples to the regularity. The more comprehensive the input data, the better.


## Merging sibling leaves with common suffixes

You might have noticed an opportunity for optimization in this graph I showed earlier:

<Image plain src="~/fur-trie.svg" minWidth={560} width={560} />

The `i`, `ó`, `ú`, `a` sibling leaves following `r->u->f` all resolve to the same value of <Ts>{'"2;ur,,i,s"'}</Ts>.

The `l` and `i` nodes have leaves with different values, which prevented the `r->u->f` subtree from being compressed. We can introduce another layer of compression that merges sibling leaves with common values. Merging sibling leaves with common values merges `i`, `ó`, `ú`, `a` into a single `ióúa` leaf:

<Image plain src="~/fur-trie-leaves-merged.svg" minWidth={560} width={560} />

Merging sibling leaves with common leaves saves us some repetition, but it affects lookups. We can handle merged keys like so in our <Ts method>trieLookup</Ts> function:

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

It's worth mentioning that, unlike merging subtrees with common values, merging sibling leaves has no functional effect.

Let's try to quantify how effective these compression techniques are.


## Quantifying trie compression

As discussed, the level of compression we get depends on the regularity and comprehensiveness of the trie's input data, but that all still feels quite abstract. Let's quantify the level of compression we get using the Icelandic personal name declension data.

We start by inserting each name and it's forms encoding into the trie. Doing that gives us an uncompressed trie with 10,284 nodes, 3,638 of which are leaves.

Merging subtrees with common values -- without merging sibling leaves -- reduces the number of nodes to 1,588 with 1,261 are leaves. If we merge leaf keys as well, we get 972 total nodes and 645 leaves.

{<table data-align="right">
<tbody>
  <tr><th>Trie state</th><th>Total nodes</th><th>Total nodes<br />(% of original)</th><th>Leaves</th><th>Leaves<br />(% of original)</th></tr>
  <tr><td className="align-left">Uncompressed</td><td>10,284</td><td>100.0%</td><td>3,638</td><td>100.0%</td></tr>
  <tr><td className="align-left"><span style={{ display: "block", maxWidth: "140px" }}>Subtrees with common suffix merged</span></td><td>1,588</td><td>15.4%</td><td>1,261</td><td>34.6%</td></tr>
  <tr><td className="align-left"><span style={{ display: "block", maxWidth: "140px" }}>Subtrees and sibling leaves with common suffix merged</span></td><td>972</td><td>9.4%</td><td>645</td><td>17.7%</td></tr>
</tbody>
</table>}

When we merged subtrees with common values, total nodes were reduced by 8,696, and of those, 2,377 were leaves. This corresponds to 6,319 _non-leaf_ nodes being removed. That's well over half.

The removal of non-leaf nodes means that the paths from the root to the leaf nodes gets shorter. Let's see how much shorter. Here's a chart showing the _traversal depth_ of lookups for the keys in the input data for the uncompressed trie and for the trie where subtrees with common values have been compressed:

<BarChart data="depth-count-weighted" width={500} minWidth={280} height={300} minHeight={200} disableNormalization />

The lookup depth for the _majority_ of names in our input data is now three or lower. That indicates quite a high degree of regularity

<BarChart data="leaf-key-count" width={540} minWidth={400} height={700} minHeight={300} horizontal />

<SmallNote center>I've omitted the long tail of 484 leaf nodes that represent fewer than 4 names</SmallNote>

Notice how the top node, `i->bdfjklmnpstvxðóú`, is the result of merging 166 leaf nodes! The merged subtree of `i` is actually fascinating. Take a look:

<Image plain src="~/i-trie.svg" minWidth={720} width={800} />