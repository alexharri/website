---
title: "Compressing Icelandic name declension patterns into a 3.3kB trie"
---

Displaying personal names in Icelandic user interfaces is surprisingly hard. This is because of _declension_ -- a language feature where the forms of nouns change to communicate a syntactic function.

In Icelandic, personal names have four forms, one for each of the [grammatical cases of Icelandic nouns][icelandic_cases]. Take the name _"Guðmundur"_:

[icelandic_cases]: https://en.wikipedia.org/wiki/Icelandic_grammar#Nouns

<Table
  columns={["Grammatical case", "Form"]}
  data={[
    ["Nominative", "Guðmundur"],
    ["Accusative", "Guðmund"],
    ["Dative", "Guðmundi"],
    ["Genitive", "Guðmundar"],
  ]}
/>

When including a name in a sentence, the sentence's structure determines the grammatical case, and correspondingly, a certain form of the name should be used. Using the wrong form results in a "broken" feel that native speakers associate with non-native speakers not yet fluent in the language.

The problem is that Icelandic personal names are always stored in the [nominative][nom_case] case. If you've loaded a user from a database, their name will be in the nominative case. This creates a problem when you have a sentence structure that requires, for example, the [accusative][acc_case] form of the name.

[nom_case]: https://en.wikipedia.org/wiki/Nominative_case
[acc_case]: https://en.wikipedia.org/wiki/Accusative_case

As a developer, you can work around that by rewriting the sentence to use the nominative case, which can be _very_ awkward, or by using a pronoun (e.g. _they_). Both are unsatisfactory.


A few years ago, I built a JavaScript library to solve this issue. It applies any of the four grammatical cases to an Icelandic name, provided in the nominative case:

```ts
applyCase("Guðmundur", "accusative")
//=> "Guðmund"
```

When building this library, I did not code _any_ declension rules by hand. Instead, the rules of Icelandic name declension are _derived_ from public Icelandic data for personal names and their forms. The rules are encoded in a trie-like data structure that uses clever compression techniques to get the bundle size under 5 kB gzipped. This lets the library be included in web apps without increasing bundle size significantly.

The rest of the post will walk through this problem in a ton of detail, and go over the compression techniques I used to get the trie to such a small size.


## Data for Icelandic name declension

Iceland has a publicly run institution, [Árnastofnun][arnastofnun_en], that manages the [Database of Icelandic Morphology][dim] (DIM). The database was created, amongst other things, to support Icelandic language technology.

[arnastofnun_en]: https://www.arnastofnun.is/en
[dim]: https://bin.arnastofnun.is/DMII/

DIM publishes various [datasets][dim_datasets], but we'll use [Kristín's Format][k_format] (the K-format), downloadable as a CSV. Here's what the K-format data entries for "Guðmundur" look like:

```
<@green>Guðmundur</@><@comment>;355264;kk;ism;1;;;;K;</@><@string>Guðmundur</@><@comment>;</@><@blue>NFET</@><@comment>;1;;;</@>
<@green>Guðmundur</@><@comment>;355264;kk;ism;1;;;;K;</@><@string>Guðmund</@><@comment>;</@><@blue>ÞFET</@><@comment>;1;;;</@>
<@green>Guðmundur</@><@comment>;355264;kk;ism;1;;;;K;</@><@string>Guðmundi</@><@comment>;</@><@blue>ÞGFET</@><@comment>;1;;;</@>
<@green>Guðmundur</@><@comment>;355264;kk;ism;1;;;;K;</@><@string>Guðmundar</@><@comment>;</@><@blue>EFET</@><@comment>;1;;;</@>
<@green>^^^^^^^^^</@>                      <@string>^^^^^^^^^</@> <@blue>^^^^</@>
<@green>Name</@>                           <@string>Form</@>      <@blue>Case</@>
```

<SmallNote label="">From this, we can see that the name "Guðmundur" in the accusative (ÞFET) case is "Guðmund", and so on.</SmallNote>

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

Luckily for us, Iceland has the [Personal Names Register][icelandic_name_registry] that lists all Icelandic personal names approved (and rejected) by the [Personal Names Committee][personal_names_committee] (yes, that exists).

[personal_names_committee]: https://en.wikipedia.org/wiki/Icelandic_Naming_Committee

We can use the set of approved Icelandic names to filter the K-format data. Of the roughly 4,500 approved Icelandic names, the K-format has declension data for over 3,600. With that, we have declension data for more than 80% of Icelandic names:

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
  // ...and over 3,600 more
]
```

[icelandic_name_registry]: https://island.is/en/search-in-icelandic-names

## Naive implementation

With the declension data in place, let's get to writing our library. The library will export a single <Ts method>applyCase</Ts> function that takes a name in the nominative case and the grammatical case that the name should be returned in:

```ts
function applyCase(name: string, grammaticalCase: Case) {
  // ...
}

applyCase("Guðmundur", "accusative")
//=> "Guðmund"
```

The naive implementation would be to find the forms of the name:

```ts
const NAME_FORMS = [ ... ]

function applyCase(name: string, grammaticalCase: Case) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
}
```

and the index of the form to return:

```ts
const CASES = ["nominative", "accusative", "dative", "genitive"];

function applyCase(name: string, grammaticalCase: Case) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
  const caseIndex = CASES.indexOf(grammaticalCase);
}
```

With those in hand, we can return the form at <Ts>caseIndex</Ts> if <Ts>nameForms</Ts> was found for the input <Ts>name</Ts>, otherwise returning <Ts>name</Ts> as a fallback:

```ts
function applyCase(name: string, grammaticalCase: Case) {
  const nameForms = NAME_FORMS.find(forms => forms[0] === name);
  const caseIndex = CASES.indexOf(grammaticalCase);
  return nameForms?.[caseIndex] || name;
}
```

This "works" but has two main issues, the first of which is bundle size. The <Ts>NAME_FORMS</Ts> list is about 30 kB gzipped, which I think is a tad much to add to a web app's bundle size.

The second issue is that this naive implementation only works for names in the <Ts>NAME_FORMS</Ts> list. As mentioned earlier, there are around 800 approved Icelandic names that are not covered by the DIM data.

Let's see how we can solve both of those.

## Encoding the forms compactly

We're currently storing the four different forms of each name in full. We can remove the redundancy by finding the [longest common prefix][longest_common_prefix] of the name and the suffixes of each form.

Consider the forms of "Guðmundur":

```
Guðmundur
Guðmund
Guðmundi
Guðmundar
```

The longest common prefix is "Guðmund", and the suffixes are as follows:

```
<@green>Guðmund</@> <@string>ur</@>
<@green>Guðmund</@>
<@green>Guðmund</@> <@string>i</@>
<@green>Guðmund</@> <@string>ar</@>
<@green>^^^^^^^</@> <@string>^^</@>
<@green>Prefix</@>  <@string>Suffix</@>
```

[root]: https://en.wikipedia.org/wiki/Root_(linguistics)
[longest_common_prefix]: https://leetcode.com/problems/longest-common-prefix

We can store the suffixes compactly in a string like so:

```ts
suffixes.join(",")
```

Which for Guðmundur, gives us:

```ts
"ur,,i,ar"
```

Since <Ts method>applyCase</Ts> receives the nominative case of the name as input, we can derive the prefix from the length of the nominative suffix's length.

```ts
function getPrefix(nameNominative, suffixLength) {
  return nameNominative.slice(0, -suffixLength);
}

const suffixes = "ur,,i,ar";
const nominativeSuffix = suffixes.split(",")[0];

getPrefix("Guðmundur", nominativeSuffix.length)
//=> "Guðmund"
```

We'll call this method of encoding the suffixes of each form in a string the "suffix encoding", or just "encoding", from here on.

A feature of the suffix encoding is that the encoding is not tied to any specific name ("Guðmund" appears nowhere). Instead, the suffix encoding describes a _pattern_ of declension, which we'll use to our advantage later.


## Retrieving the suffixes by name

When we were storing the raw forms in an array, it was very easy to find the forms of any given name:

```ts
NAME_FORMS.find(forms => forms[0] === name)
```

But the suffix encoding doesn't encode the name itself, so we need a way to retrieve the encoding. The simplest method would be a plain hash map:

```ts
const nameToFormsEncoding = {
  Guðmundur: "2;ur,,i,ar",
  // ...3,600 more lines
};
```

Putting bundle size concerns aside, a hash map doesn't solve the problem of names not in the list of approved Icelandic names being excluded.

Here, one helpful fact about Icelandic declension is that names with similar suffixes _tend_ to follow the same pattern of declension. These names ending in _"ur"_ all have the same suffix encoding of <Ts>{'"2;ur,,i,ar"'}</Ts>:

```
Ástvaldur
Bárður
Freymundur
Ingimundur
Sigurður
Þórður
```

There are, in fact, 88 approved Icelandic names with this exact pattern of declension, and they all end with _"dur"_, _"tur"_ or "_ður_".

The naive approach, then, would be to implement a <Ts method>getSuffixEncoding</Ts> function that captures these patterns:

```ts
function getSuffixEncoding(name) {
  if (/(d|ð|t)ur$/.test(name)) {
    return "2;ur,,i,ar";
  }
  // ...
}
```

But that quickly breaks down. There are other names ending with _"ður"_ or _"dur"_ that follow a different pattern of declension:

* _"Aðalráður"_ and _"Arnmóður"_ have a suffix encoding of <Ts>{'"2;ur,,i,s"'}</Ts>
* _"Baldur"_ has a suffix encoding of <Ts>{'"2;ur,ur,ri,urs"'}</Ts>
* _"Hlöður"_ and _"Lýður"_ both have a suffix encoding of <Ts>{'"2;ur,,,s"'}</Ts>

In fact, take a look at this [gist][names_by_suffix_encoding] showing every approved Icelandic personal name grouped by their suffix encoding (there are 124 unique encodings). You'll immediately find patterns, but if you take a closer look you'll find numerous counterexamples to those patterns. Capturing all of these rules and their exceptions in code would be a tedious and brittle affair.

[names_by_suffix_encoding]: https://gist.github.com/alexharri/b35b40d27db664d6e0dcb9a2ac511090

Instead of trying to code up the rules manually, we can use a data structure that lends itself perfectly to this problem.


## Tries

The [trie][trie] data structure, also known as a prefix tree, is a tree data structure that maps string keys to values. In tries, each character in the key becomes a node in the tree that points to the next possible characters.

[trie]: https://en.wikipedia.org/wiki/Trie

Take, for example, the name _"Heimir"_, which has a suffix encoding of <Ts>{'"1;r,,,s"'}</Ts>. If we create an empty trie and insert _"Heimir"_ and <Ts>{'"1;r,,,s"'}</Ts> as a key-value pair into it, we get:

<Image plain src="~/heimir-trie.svg" width={630} scrollable />

Let's now insert _"Heiðar"_ into the trie, which has a suffix encoding of <Ts>{'"1;r,,i,s"'}</Ts>. The names share the first three characters, so they share the first three nodes in the trie:

<Image plain src="~/heimir-heidar-trie.svg" width={630} scrollable />

However, we actually want to insert the keys _backwards_ into the trie. That is because, like I mentioned earlier, names with similar endings (suffixes) tend to have similar suffix encodings. Inserting keys backwards results in the values for all names sharing a certain suffix being grouped within that suffix's subtree.

Let's take a concrete example -- consider the following names that end with _"ur"_ and their encodings:

```
<@blue>Ylfur</@>    <@string>2;ur,i,i,ar</@>
<@blue>Knútur</@>   <@string>2;ur,,i,s</@>
<@blue>Hrútur</@>   <@string>2;ur,,i,s</@>
<@blue>Loftur</@>   <@string>2;ur,,i,s</@>

<@blue>Name</@>     <@string>Suffix encoding</@>
```

Inserting them _backwards_ into a new trie gives us the following:

<Image plain src="~/ur-divergence.svg" width={630} scrollable />

Once we start inserting the names backwards, every node in the trie corresponds to a specific suffix match:

 * The <Node>r->u</Node> subtree corresponds to the _"ur"_ suffix.
 * The <Node>r->u->t</Node> subtree corresponds to the _"tur"_ suffix.

Additionally:

 * The <Node>r->u</Node> subtree contains the values for all names ending in _"ur"_.
 * The <Node>r->u->t</Node> subtree contains the values for all names ending in _"tur"_.

Having the values of names sharing a common suffix all within the same subtree will help us find patterns in suffix-to-value mappings. We can then apply those patterns to not-before-seen names.

Before we get to that, let's quickly cover trie lookups.

## Trie lookups

Let's implement a <Ts method>trieLookup</Ts> function that takes the trie's <Ts>root</Ts> node and a <Ts>key</Ts> (name) to find a value for:

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

for (const char of reverse(key)) {
  node = node.children?.[char];
  if (!node) {
    break;
  }
}
```

<SmallNote>We reverse the lookup key because names are inserted into the trie backwards.</SmallNote>

After that, we'll return the value of the resulting <Ts>node</Ts>, if present:

```ts
return node?.value;
```

giving us the following implementation:

```ts
function trieLookup(root: TrieNode, key: string) {
  let node: TrieNode | undefined = root;
  for (const char of reverse(key)) {
    node = node.children?.[char];
    if (!node) {
      break;
    }
  }
  return node?.value;
}
```

This returns the value for the name, as expected:

```ts
trieLookup(root, "Loftur")
//=> "2;ur,,i,s"
```


## Compressing the trie

In our trie from earlier, every leaf in the <Node>r->u->t</Node> subtree has the same value of <Ts>{'"2;ur,,i,s"'}</Ts>:

<Image plain src="~/ur-divergence.svg" width={630} scrollable />

When every leaf in a subtree has a common value, we can _compress_ the subtree. We do that by setting the value of the subtree's root to the value of its leaves, and then deleting every child of the root.

<Image plain src="~/ur-divergence-merged.svg" width={450} scrollable />

<SmallNote label="" center>The trie from above, compressed.</SmallNote>

Let's quickly implement a recursive <Ts method>compress</Ts> function that performs this operation:

```ts
function compress(node: TrieNode): string | null {
  // ...
}
```

The <Ts method>compress</Ts> function should return <Ts>null</Ts> and do nothing if <Ts>node</Ts>'s children do not share a single common value. If they _do_ share a common value, it should delete all of its children and assign their common value to itself.

The first step is to collect the values of <Ts>node</Ts>'s children by invoking <Ts method>compress</Ts> recursively (using a [depth-first][dfs] traversal):

```ts
const values = Object.values(node.children).map(compress);
```

[dfs]: https://en.wikipedia.org/wiki/Depth-first_search

If there is not a single shared value, we return <Ts>null</Ts>:

```ts
if (new Set(values).size !== 1 || values[0] == null) {
  return null;
}
```

Otherwise, we assign the value to <Ts>node</Ts>, remove the children, and return the value.

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

<Image plain src="~/ur-divergence-merged.svg" width={450} scrollable />

After compressing the trie, it communicates the following information:

 * All names ending in _"fur"_ resolve to a value of <Ts>{'"2;ur,i,i,ar"'}</Ts>
 * All names ending in _"tur"_ resolve to a value of <Ts>{'"2;ur,,i,s"'}</Ts>

When we originally inserted _"Ylfur"_ into the trie, the associated value was stored under <Node>r->u->f->l->Y</Node>, but after compressing the trie, only the <Node>r->u->f</Node> part of that path remains.

This means that our <Ts method>trieLookup</Ts> function from earlier will return <Ts>null</Ts> for _"Ylfur"_:

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

trieLookup(root, "Ylfur")
//=> null
```

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

trieLookup(root, "Ylfur")
//=> "2;ur,i,i,ar"
```

<SmallNote label="" center>We only override <Ts>node</Ts> if there is a <Ts>next</Ts> node.</SmallNote>

Now, looking up the original four input names returns the values for those names:

```ts
trieLookup(trie, "Ylfur")  //=> "2;ur,i,i,ar"
trieLookup(trie, "Knútur") //=> "2;ur,,i,s"
trieLookup(trie, "Hrútur") //=> "2;ur,,i,s"
trieLookup(trie, "Loftur") //=> "2;ur,,i,s"
```

However, we also get values for lookup keys not in the original input data:

```ts
trieLookup(trie, "Bjartur")
//=> "2;ur,,i,s"
```

This was not the case prior to compressing the trie -- only the original input keys returned a value in the original trie. 

Lookups in the compressed trie return

 * <Ts>{'"2;ur,i,i,ar"'}</Ts> for all lookup keys matching `*fur`, and
 * <Ts>{'"2;ur,,i,s"'}</Ts> for all lookup keys matching `*tur`.

The compressed trie has, in some sense, "learned" the suffix patterns of the input data, and returns values based on that.

Names in the input data ending in `*tur` always resolved to the same value so the <Node>r->u->t</Node> subtree was compressed — same with `*fur`. However, there were multiple values for names ending in `*ur` so the tree diverges after <Node>r->u</Node>:

<Image plain src="~/ur-divergence-merged.svg" width={430} scrollable />

This divergence raises a question: what about names matching `*ur` but neither `*fur` nor `*tur`?

_"Sakur"_ is one such key. When invoking <Ts method>trieLookup</Ts> the last hit <Ts>node</Ts> is the <Node>u</Node> node. Since <Node>u</Node> has no value, <Ts>null</Ts> is returned:

```ts
trieLookup(trie, "Sakur")
//=> null
```

If every key in the trie's input data ending in `*ur` resolves to the same value, then _"Sakur"_ should resolve to that value. However, not every key ending in `*ur` resolves to the same value -- keys ending in `*tur` resolve to one value and keys ending in `*fur` to another.

For a key matching `*ur` but not `*(t|f)ur`, we _could_ just pick one of the branches. However, at most one of the branches resolves to the correct value (and in many cases, none of the branches do). The natural conclusion, then, is to _not_ return a value.

---

The compressed trie acts as a sort of suffix-to-value pattern matcher. If a certain suffix in the input data always maps to a certain value, the compressed trie always returns that value for keys matching the suffix. But for "ambiguous" suffix matches, no value is returned.

The idea is to apply this to Icelandic name declension. Since Icelandic names with similar suffixes _tend_ to have the same pattern of declension, the theory is that the compressed trie should be able to predict the correct pattern of declension for not-before-seen names. Let's see how well that theory holds.

## Compressing 3,600 names

Of the 4,500 approved Icelandic names, we have declension data for roughly 3,600.

Inserting those names and their suffix encodings into a new trie gives us a trie with 10,284 nodes, 3,638 of which are leaves. Compressing the trie by merging subtrees with common values reduces the total number of nodes to 1,588. Of those, 1,261 are leaves and 327 are not.

<Table
  align="right"
  columns={[{ title: "", align: "left" }, "Uncompressed", "Compressed", "Compressed (%)"]}
  data={[
    ["Total nodes", "10,284", "1,588", "15.4%"],
    ["Non-leaf nodes", "6,646", "327", "4.9%"],
    ["Leaf nodes", "3,638", "1,261", "34.6%"]
  ]}
/>

Compressing the trie resulted in 6,319 non-leaf nodes being removed, which is __over 95%__.

The removal of non-leaf nodes means shorter paths from the root to the leaves of the trie. Here's a chart showing the traversal depth of lookups for the keys in the input data for the compressed and uncompressed tries:

<BarChart data="depth-count-weighted" width={500} minWidth={280} height={300} minHeight={200} disableNormalization />

Lookup depth correspond to the length of the suffix match needed for a value to be returned. For the majority of names in the original input data, that length is three or lower in the compressed trie. 

### Testing the trie on not-before-seen names

In testing how well the compressed trie predicts the declension patterns of not-before-seen names, the 800 approved Icelandic names that we don't have declension data for serve as good test cases.

I wrote a function to pick 100 of those names at random and (manually) categorized the declension pattern returned when looking those names up in the trie:

<Table
  columns={[
    "Result",
    { title: "Count", align: "right" },
  ]}
  data={[
    ["Perfect (declension applied)", 62],
    ["Perfect (no declension applied)", 12],
    ["Should have applied declension", 23],
    ["Wrong, should not be declined", 2],
    ["Wrong declension", 1],
  ]}
/>

This gives us a rough indication that, for not-before-seen Icelandic names, the compressed trie gives us correct results 74% of the time and wrong results 26% of the time.

<SmallNote label="">The _"Should have applied declension"_ case, which constitutes 23% of results, results in <Ts method>applyCase</Ts> not applying declension to the name and returning it as-is. That result _is_ wrong, but I consider it a lesser kind of wrong.</SmallNote>

Still, these are just 100 random names. Some names are far more common than others. It'd be more interesting to see how well the compressed trie performs for the most common names.

Luckily for us, [Statistics Iceland][statice] publishes data on [how many individuals have specific names][names]. Using that data, I created the chart below. It shows the number of people holding each name in the approved list of names as a first name. The 3,600 names with declension data available are colored blue. The 800 names without declension data are colored red:

[names]: https://statice.is/statistics/population/births-and-deaths/names/

[statice]: https://www.statice.is/

<BarChart data="names-count" width={1200} minWidth={800} height={400} minHeight={375} logarithmic toggleLogarithmic />

<SmallNote>Since relatively few names dominate this list, I made the chart logarithmic by default. You can use the toggle in the upper-right corner to make it linear.</SmallNote>

363,314 people hold a name from the approved list of Icelandic names as a first name. Of those, 5,833 have names that don't have declension data available.

As we can see from the chart, the commonality of names is far from evenly distributed. In fact, the top 100 names without declension data are held by 4,990 people. Those 4,990 people constitute 86% of the 5,833 people that hold one of the 800 names without declension data available.

I went ahead and categorized the declension results for those 100 names, multiplying the result by the number of people holding the name:

<Table
  columns={[
    { title: "Result", align: "left" },
    { title: "Number of people", align: "right" },
  ]}
  data={[
    ["Perfect (declension applied)", "3,489"],
    ["Perfect (no declension applied)", "440"],
    ["Should have applied declension", "915"],
    ["Wrong, should not be declined", "101"],
    ["Wrong declension", "45"],
    ["Total", "4,990"],
  ]}
/>

1,061 wrong results gives us an error rate of 21%. If we extrapolate that 21% error rate across the 5,833 people holding names without declension data available, we get 1,240 wrong results. Dividing 1,240 wrong results by the 363,314 people holding names in the approved list of Icelandic names gives us an error rate of 0.34%.

If we do the same math with only the names that were _incorrectly_ declined, we get an error rate of 0.046%.

## Regularity and comprehensiveness

The compressed trie captures the rules of Icelandic name declension to an impressive degree. I attribute this to the _regularity_ and _comprehensiveness_ of the data on Icelandic name declension, where

 * _regularity_ is the degree to which similar key suffixes map to the same values, and
 * _comprehensiveness_ is how well the input data captures rules _and_ exceptions to them.

### Regularity

If the input data were _irregular_ -- meaning that there's no significant relationship between suffixes and associated values -- the values of leaves in subtrees would frequently differ. That would prevent subtree compression, resulting in a not-very-compressed trie that is similar, if not identical, to the original trie. The less a trie is compressed, the longer the suffix match needs to be for a value to be returned.

The opposite happens as the input data becomes more regular. Subtrees will be more frequently compressed, leading to shorter suffix matches being required for values to be returned.

### Comprehensiveness

Subtrees are only ever incorrectly compressed if the original trie lacks a counterexample to the regularity that led to compression. If a counterexample had been present, it would have prevented compression and created an exception to the rule.

If we pick, say, 450 Icelandic names at random, we will capture many of the rules of Icelandic name declension, and some counterexamples to them. Still, 450 names are only about 10% of approved Icelandic names, so we can expect loads of declension rules _not_ to be covered by that sample.

But with over 3,600 samples, as in our case, we have over 80% coverage. With data that comprehensive, the compressed trie captures the rules -- and exceptions to those rules -- to an impressive degree.

## Bundle size

I've mentioned bundle time a few times — let's finally measure it!

I measured the size of storing the declension data for the 3,600 names that we have declension data for in the following ways:

 * List (the <Ts>NAME_FORMS</Ts> list from before)
 * Trie (uncompressed)
 * Trie (compressed)

Here are the results:

```
List
    30.17 kB gzipped (152.48 kB minified)

Trie (uncompressed)
    14.47 kB gzipped (66.68 kB minified)

Trie (compressed)
    4.01 kB gzipped (14.41 kB minified)
```

<SmallNote>The trie is serialized to a compact string representation to make its size smaller (see [serializer][serializer] and [deserializer][deserializer]). For comparison, the compressed trie represented as JSON is 4.75 kB.</SmallNote>

[serializer]: https://github.com/alexharri/beygla/blob/77f63a3132275fe58509a024f33b478bb3e54e38/lib/compress/trie/serialize.ts
[deserializer]: https://github.com/alexharri/beygla/blob/77f63a3132275fe58509a024f33b478bb3e54e38/lib/read/deserialize.ts

4.01 kB is very compact, but we can take the compression one step further.


## Merging sibling leaves with common suffixes

Take a look at the <Node>r->u->f</Node> subtree from the compressed trie -- it represents names matching `*fur`:

<Image plain src="~/fur-trie.svg" width={595} scrollable />

<SmallNote center>I've hidden the full `*lfur` subtree to simplify this view.</SmallNote>

The <Node>i</Node>, <Node>ó</Node>, <Node>ú</Node>, <Node>a</Node> sibling leaves following <Node>r->u->f</Node> all resolve to the same value of <Ts>{'"2;ur,,i,s"'}</Ts>. However, the <Node>l</Node> and <Node>i</Node> subtrees have leaves with different values, which prevented the <Node>r->u->f</Node> subtree from being compressed.

What we can do here is merge sibling leaves with common values. That results in the <Node>i</Node>, <Node>ó</Node>, <Node>ú</Node>, <Node>a</Node> leaves being merged into a single <Node>ióúa</Node> leaf node:

<Image plain src="~/fur-trie-leaves-merged.svg" width={640} scrollable />

Let's implement a <Ts method>mergeLeavesWithCommonValues</Ts> function that performs this compression.

```ts
function mergeLeavesWithCommonValues(node: TrieNode) {
  // ...
}
```

Firstly, if the <Ts>node</Ts> has no children, we can immediately return, otherwise performing the operation recursively on the children:

```ts
if (!node.children) {
  return;
}

for (const child of Object.values(node.children)) {
  mergeLeavesWithCommonValues(child)
}
```

For the children of <Ts>node</Ts>, there are two cases to handle:

 1. The child is a leaf node with a <Ts>value</Ts>.
 2. The child is a non-leaf node.

We want to merge leaf nodes with the same value, so we'll group the keys of leaf nodes by their value:

```ts
const keysByValue: Record<string, string> = {};
```

However, we want to leave non-leaf nodes alone, so we'll define a new <Ts>newChildren</Ts> object to place them into as we encounter them:

```ts
const newChildren: Record<string, TrieNode> = {};
```

With those defined, we'll iterate through the children, transferring non-leaf nodes immediately and grouping leaf keys by values:

```ts
for (const [key, child] of Object.entries(node.children)) {
  const isLeaf = !!child.value;
  if (isLeaf) {
    keysByValue[child.value] ??= [];
    keysByValue[child.value].push(key)
  } else {
    newChildren[key] = child;
  }
}
```

<SmallNote label="">When looking at this, one could be concerned that a <Ts>child</Ts> might contain both a value _and_ children. In our Icelandic names trie, however, there is no overlap because each name in the input data starts with an uppercase character.</SmallNote>

After iteration, we can construct the merged leaves and add them to <Ts>newChildren</Ts> like so:

```ts
for (const [value, keys] of Object.entries(keysByValue)) {
  newChildren[keys.join("")] = { value };
}
node.children = newChildren;
```

This concludes the implementation. The full implementation is a bit long, so I won't show it in full here -- you can view it in this [gist on GitHub][mergeLeavesWithCommonValues].

[mergeLeavesWithCommonValues]: https://gist.github.com/alexharri/5dfc904643ac22c76bf913adae40a3a8

We need to consider merged keys in our <Ts method>trieLookup</Ts> function. To do that, we'll update the <Ts method>trieLookup</Ts> function to use a new <Ts method>findChild</Ts> function instead of <Ts>node.children?.[char]</Ts> when finding the next node.

```ts
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

Implementing <Ts method>findChild</Ts> is relatively simple: we iterate through the children, returning the current child if its key contains the lookup character:

```ts
function findChild(node: TrieNode, char: string) {
  const children = node.children || {};

  for (const [key, child] of Object.entries(children)) {
    if (key.includes(char)) {
      return child
    }
  }
}
```

It's worth mentioning that, unlike merging subtrees with common values, merging sibling leaves has no functional effect on the trie. This layer of compression is purely to make the trie's footprint smaller.

### Trie after merging sibling leaves

Here is the node count table from before with a new column that shows the results for the trie that has also had its sibling leaves merged:

<Table
  align="right"
  columns={[
    { title: "", align: "left" },
    "Uncompressed",
    { title: "Only subtrees merged", width: 150 },
    { title: "Subtrees and sibling leaves merged", width: 200 }
  ]}
  data={[
    ["Total nodes", "10,284", "1,588", "972"],
    ["Non-leaf nodes", "6,646", "327", "327"],
    ["Leaf nodes", "3,638", "1,261", "645"],
  ]}
/>

Merging sibling leaf nodes with common values almost cuts the number of leaf nodes in half! Since we're only touching the leaf nodes, the number of non-leaf nodes stays the same. Lookup depth is also not affected.

One interesting statistic is how many names in the original input data each leaf node now represents. Here are the top 50 leaf nodes by the number of names they represent:

<BarChart data="leaf-key-count" width={540} minWidth={400} height={1000} minHeight={300} horizontal />

The top node <Node>i->bdfjklmnpstvxðóú</Node> is the result of merging 166 leaf nodes. That indicates that Icelandic names ending in _"i"_ exhibit a high degree of regularity in their pattern of declension.

Let's take a closer look at the <Node>i</Node> subtree. Next to each value node, I've added the number of names that the leaf node represents in parentheses.

<Image plain src="~/i-trie.svg" width={860} scrollable />

The <Node>i</Node> subtree is built from 223 names starting with _"i"_. Only four of those names don't follow the declension pattern of <Ts>{'"1;i,a,a,a"'}</Ts>. That's a really high degree of regularity!

Those four names serve as important counterexamples to the general rule that names ending in _"i"_ have a suffix encoding of <Ts>{'"1;i,a,a,a"'}</Ts>. Without them, the <Node>i</Node> subtree would have been compressed to a single value node.


## Final bundle size

Here's what merging sibling leaves with common values did for the bundle size of the trie:

```
List
    30.17 kB gzipped (152.48 kB minified)

Trie (uncompressed)
    14.47 kB gzipped (66.68 kB minified)

Trie (subtrees merged)
    4.01 kB gzipped (14.41 kB minified)

Trie (subtrees and leaves merged)
    3.27 kB gzipped (9.3 kB minified)
```

It saves us 0.74 kB. That's a small number in absolute terms, but hey, it's an 18% improvement!


## The beygla library

I use the compressed trie in a declension library for Icelandic names called [beygla][beygla]. The library is 4.46 kB gzipped, 3.27 kB of which is the serialized trie. As described, it exports an <Ts method>applyCase</Ts> function that is used to apply grammatical cases to Icelandic names.

[beygla]: https://github.com/alexharri/beygla

The beygla library is used, for example, by the Icelandic judicial system to [decline the names of defendants][indictment_beygla] in indictments.

[indictment_beygla]: https://github.com/island-is/island.is/blob/6a15e6524a452142c4f09d84b9bc256fef544673/apps/judicial-system/web/src/routes/Prosecutor/Indictments/Indictment/Indictment.tsx#L73

The library includes a <Ts>{'"beygla/addresses"'}</Ts> module ([see motivating issue][beygla_addresses_issue]). It uses the exact same approach, with that module's trie being built from data on Icelandic addresses.

[beygla_addresses_issue]: https://github.com/alexharri/beygla/issues/16


### Trading bundle size for 100% correctness

The indictment example I linked above uses the [strict version][beygla_strict] of beygla:

```ts
import { applyCase } from "beygla/strict";
```

[beygla_strict]: https://github.com/alexharri/beygla/pull/15

The <Ts>{'"beygla/strict"'}</Ts> module only applies cases to names in the approved list of Icelandic names. I added it after [this issue][beygla_strict_issue] was raised:

> _"We are using beygla in a project within the public sector. Our users care __a lot__ about using grammatically correct Icelandic."_

[beygla_strict_issue]: https://github.com/alexharri/beygla/issues/14

When first developing beygla, I cared _a lot_ about the bundle size being as small as possible so that Icelandic web apps could use the library without being concerned about JavaScript bloat. I found the compressed trie really powerful in that it both made the library _tiny_ while also applying declension to not-before-seen names with few errors. There's certainly a cool factor to it.

But still, beygla does occasionally produce a wrong result, which is _not_ an appropriate trade-off in contexts such as generating indictments. <Ts>{'"beygla/strict"'}</Ts> is about 15 kB gzipped (10 kB more than the default beygla module), which, honestly, is not that large of a bundle size increase.

Because of that, if I were developing the library again today, I probably would have made <Ts>{'"beygla/strict"'}</Ts> the default. For apps willing to trade 100% correctness for bundle size, they could opt for the less-but-mostly-correct 5 kB variant. Perhaps I'll publish a new major version of beygla with that change soon.

<SmallNote>The `beygla/strict` module encodes the list of approved Icelandic names in _another_ trie using a compact string serialization. The [implementing PR][beygla_strict] describes how that trie is serialized, so I won't cover it here.</SmallNote>


## Final words

Building beygla was a super fun problem to solve. When I first started the project, I didn't expect to be able to get the bundle size so low. The compressed trie ended up being really effective for encoding Icelandic declension patterns.

If Icelandic language technology is something that's interesting to you, I'd suggest checking out [Miðeind][mideind] -- they have a lot of open source projects around AI and natural language processing for Icelandic.

[mideind]: https://github.com/mideind

[suffix_trie]: https://en.wikipedia.org/wiki/Suffix_tree

There are many languages with declension as a language feature (such as Slavic and Balkan languages), so there is an opportunity to apply the ideas explored in this post to those languages. Native speakers of said languages are well suited to explore that.

I'd like to thank [Eiríkur Fannar Torfason][eirikur_dev] and [Vilhjálmur Thorsteinsson][villi] for reading and providing feedback on draft versions of this post. Vilhjálmur actually identified an optimization opportunity in beygla that reduced the size of the trie from 3.43 kB to 3.27 kB ([see PR][beygla_pr_25]).

[eirikur_dev]: https://eirikur.dev/
[villi]: https://www.linkedin.com/in/villithorsteinsson/
[beygla_pr_25]: https://github.com/alexharri/beygla/pull/25

Thanks for reading, I hope this was interesting.

-- Alex Harri
