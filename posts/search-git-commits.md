---
title: "Searching for code in Git commits"
description: ""
image: ""
publishedAt: ""
tags: []
---

I sometimes encounter code that puzzles me. When that happens, it's usually because I lack some context. Perhaps the code is that way because of a bug fix that's not immediately obvious at a glance, or maybe there are constraints I'm not yet aware of.

To get more context, I often use [Git blame][git_blame] to view the commit (and usually, the associated pull request) that added the code.

[git_blame]: https://git-scm.com/docs/git-blame

Sometimes the pull request has a description (or a link to an issue with one) which clarifies the change. I love it when there are useful discussions added during code review—those are super valuable, especially if they're discussing that exact change. If both of those fail, the commit itself often contains related changes from which I can glean the intention behind the code.

However, the commit that Git blame points to is often not the change that introduced the behavior. Perhaps the commit is just a refactor, or an automated formatting change. Not useful.

Code archeology is a big part of being a professional software engineer. To effectively reason about and change a system, you need to understand how it works and why it was made to work that way. Those sorts of non-functional commits just get in the way of that process.

In this post, I want to take a good look at this problem and share an effective tool I found for digging into code. Let's get to it!

{/*
But sometimes the last commit that touched the code you're looking at is a non-functional change, like a pure formatting change or a commit just moving lines of code around. When this happens, we need go to the file prior to that change and repeat the `git blame`. When this happens multiple times in a row, it quickly becomes laborious.

I recently encountered one of these long chains of non-function commits and decided to find a better way to go about code archeology. In this post, I'll share the method I found to quickly find code snippets in Git commits.
*/}


## Running Git blame on a piece of code

Let's say we have a mysterious piece of code whose intent is not clear:

```ts
const { MPP_ACTIVE } = process.env;

if (MPP_ACTIVE === "true") {
  doSomeFunkyStuff();
}
```

What does "MPP" stand for? And what does it mean for it to be active? Let's use Git blame to see the commit that introduced this:

{/*
<Image src="~/git-blame-example.png" width={800} />
*/}

```
▶ git blame example.js -s -L 7,9

1edd8004 7) if (MPP_ACTIVE === "true") {
c457405a 8)   doSomeFunkyStuff();
c457405a 9) }
```

<SmallNote>The `-s` option strips the verbose author and date information. `-L` selects specific lines.</SmallNote>


Let's take a look at the commit for line 7, which seems to be add the `MPP_ACTIVE` check:

<Image src="~/git-blame-commit-0.png" width={540} />

Hmm, no, that's not it—that's just a refactoring change. We need to go further back to find the change that introduced the core behavior.

To do that, we need to repeat the process and run Git blame again on the prior version of the file. Let's keep going and see what we get.

<p align="center">What we find is a refactoring change...</p>

<Image src="~/git-commit-1.png" width={420} />

<p align="center">...another refactoring change...</p>

<Image src="~/git-commit-2.png" width={420} />

<p align="center">...and a change just moving things around.</p>

<Image src="~/git-commit-3.png" width={420} />

These sorts of chains can get surprisingly long. During the lifecycle of a code base, code get tweaked, refactored and moved around. Over the years, those changes snowball into long chains of indirection.

What we care about is the commit where `MPP_ACTIVE` was introduced. Ideally, we'd be able to search for commits that mentions `MPP_ACTIVE` and just look at the earliest one. This is where `git log -S` comes in handy.


## Searching for code in commits

By default, the `git log` command lists every commit. The `-S` option accepts a case-sensitive string used to filter out commits whose diffs don't include the input string.

```bash
# Show commits that include "foo_bar" in the diff
git log -S "foo_bar"
```

You can imagine this working like so:

```ts
if (typeof args.S === "string") {
  commits = commits.filter(commit => commit.diff.includes(args.S));
}
```

So let's try running `git log -S "MPP_ACTIVE"` and see what we get:

```
▶ git log -S "MPP_ACTIVE"

commit 33a8b6ea050963e452b1d16165f64a77df3ff054
Author: johndoe42, Date: Sept 14 2022

    refactor

commit 8fed03eadf2afc5efe91ddf0cf7a7837c8b680fe
Author: aliceb76, Date: Jan 19 2022

    do funky stuff if MPP_ACTIVE is set
```

<SmallNote label="" center>I've edited the output slightly to make it a tad more compact (2 lines instead of 3).</SmallNote>

I find the default output format far too verbose, so I almost always use `--oneline` to compact it:

```
▶ git log -S "MPP_ACTIVE" --oneline

33a8b6e refactor
8fed03e do funky stuff if MPP_ACTIVE is set
```

Anyway, the output is ordered from most recent to oldest, which means that `8fed03e` is the first commit in the codebase that mentioned `MPP_ACTIVE`. It turns out that commit is exactly the one we were looking for!

<Image src="~/git-commit-4.png" width={460} plain />

Let's move past this simple example and try `git log -S` on a more mature codebase. We'll use the Next.js repository as an example for the rest of this post.


## Using `git log -S` in larger codebases

Next.js has a [`distDir` option][distdir] that allows the user to specify custom build directory. As an exercise, let's try finding the commit that added the option.

[distdir]: https://nextjs.org/docs/pages/api-reference/next-config-js/distDir

So let's run `git log -S "distDir"` and see what we get:

```
▶ git log -S "distDir" --oneline

5c1828bdd6 Handle source map [...] chunks (#71168)
d8c0539b08 fix: allow custom [...] conventions (#71153)
490704430b Add source map [...] the browser (#71042)
13f8fcbb6b [Turbopack] Implement [...] `stats.json` (#70996)
3b9889e1d8 [Turbopack] add new backend (#69667)
30789cc19f Auto rotate Server [...] periodically (#70516)
0539477e7c types: improve napi binding [...] types (#69680)
...over 400 more commits
```

Hmm... these are all recent commits. `git log` orders commits from most recent to oldest by default. We want to find the earliest mentions of `distDir` so we'd like the older commits to come first.

`git log` has a handy `--reverse` flag just for that purpose.

```
▶ git log -S "distDir" --oneline --reverse

acc1983f80 Don't delete `.next` folder before a replacement is built (#1139)
141ab99888 build on tmp dir (#1150)
9347c8bdd0 Specify a different build directory for #1513 (#1599)
8d2bbf940d Refactor the build server to remove tie to fs (#1656)
dec85fe6c4 Add CDN support with assetPrefix (#1700)
cb635dd9a5 use configured distDir where required (#1816)
ca9146c421 support custom build directory in next export (#2135)
... over 400 more commits
```

Nice! This gives us the first commits in `vercel/next.js` mentioning `distDir`.

It's not necessarily obvious which one we care about. Let's look at some tools at our disposal to analyze these commits at a high level to quickly figure out which one of them we care about.


## Commits at a glance

Reading the full diffs of the commits via `git diff` would be exhausting. One quick way to get a feel for a commit is to view the files that a commit touched, which we can do via `git show <commit> --stat`. Let's try that on the first commit in the list:

```
▶ git show acc1983f80 --stat --oneline

acc1983f80 Don't delete `.next` folder before a replacement is built (#1139)
 .gitignore              |  3 ++-
 server/build/clean.js   |  4 ++--
 server/build/gzip.js    |  4 ++--
 server/build/index.js   | 19 +++++++++++--------
 server/build/replace.js | 18 ++++++++++++++++++
 server/build/webpack.js |  4 ++--
 server/hot-reloader.js  |  2 +-
 7 files changed, 38 insertions(+), 16 deletions(-)
```

<SmallNote>The `--oneline` option works the same as in `git log`, compacting the commit log.</SmallNote>

This quickly gives us a sense of which files are being changed, and how much.

We can narrow this down even further with the `-S` option, just like in `git log`. Using `--stat` in conjuction with `-S "distDir"` will show us only those touched files whose diff includes `distDir`:

```
▶ git show acc1983f80 --stat --oneline -S "distDir"

acc1983f80 Don't delete `.next` folder before a replacement is built (#1139)
 server/build/replace.js | 18 ++++++++++++++++++
 1 file changed, 18 insertions(+)
```

That certainly narrows it down! Let's view the diff for `server/build/replace.js`, which we can do via `show <commit> -- <file>`:

```
▶ git show acc1983f80 -- server/build/replace.js

+++ b/server/build/replace.js
@@ -0,0 +1,18 @@
+
+  const distDir = path.resolve(dir, distFolder)
+  const buildDir = path.resolve(dir, buildFolder)
+
```

<SmallNote center>I've shortened the output for clarity.</SmallNote>

Hmm, `distDir` is just a local variable name in this commit. Let's keep looking.

The next commit of interest seems to be `9347c8bdd0`, which talks about specifying a build directory:

```
▶ git log -S "distDir" --oneline --reverse

acc1983f80 Don't delete `.next` folder before a replacement is built (#1139)
141ab99888 build on tmp dir (#1150)
9347c8bdd0 Specify a different build directory for #1513 (#1599)
# ...
```

As a first step, we look at a summary of which files changed via `show --stat`:

```
▶ git show 9347c8bdd0 --stat --oneline

9347c8bdd0 Specify a different build directory for #1513 (#1599)
 .gitignore                                   |  2 ++
 bin/next-build                               |  5 +++--
 bin/next-dev                                 |  5 +++--
 bin/next-start                               |  9 ++++++---
 readme.md                                    | 13 ++++++++++++-
 server/build/clean.js                        |  4 +++-
 # ...9 more files
 15 files changed, 128 insertions(+), 34 deletions(-)
```

15 files changed. We can reduce that number by only showing files whose diff includes `distDir` via the `-S` option:

```
▶ git show 9347c8bdd0 --stat --oneline -S "distDir"

9347c8bdd0 Specify a different build directory for #1513 (#1599)
 bin/next-start                           |  9 ++++++---
 readme.md                                | 13 ++++++++++++-
 server/build/clean.js                    |  4 +++-
 server/build/index.js                    | 19 ++++++++++++-------
 server/build/replace.js                  |  9 ++++++---
 server/build/webpack.js                  |  2 +-
 server/config.js                         |  3 ++-
 server/index.js                          | 15 ++++++++-------
 server/render.js                         | 17 +++++++++++------
 test/integration/dist-dir/next.config.js |  7 +++++++
 10 files changed, 68 insertions(+), 30 deletions(-)
```

This looks promising! Let's start looking at some diffs to see if this is the commit we're looking for. We can do that in two ways:

 1. Look at the diff for a specific file via `show <commit> -- <file>`, or
 2. look at diffs for all files that mention `distDir` via `show <commit> -S <code>`.

Since we don't know which file to look at, let's look at all of the files. After scrolling a bit, this addition to `readme.md` crops up:

```
▶ git show 9347c8bdd0 -S "distDir" --oneline

diff --git a/readme.md b/readme.md
+ #### Setting a custom build directory
+ 
+ You can specify a name to use for a custom build directory. For
+ example, the following config will create a `build` folder instead
+ of a `.next` folder. If no configuration is specified then next
+ will create a `.next` folder.
+ 
+ ```javascript
+ // next.config.js
+ module.exports = {
+   distDir: 'build'
+ }
+ ```
```

Looks like `9347c8bdd0` was the commit that added this option! Opening the commit on GitHub shows us the [associated Pull Request][PR_1599], which also links to the [issue requesting the feature][issue_1513]. The issue provides us with the original motive for adding `distDir` as an option:

[PR_1599]: https://github.com/vercel/next.js/pull/1599
[issue_1513]: https://github.com/vercel/next.js/issues/1513

> I am trying to deploy next to Firebase functions, and it looks like the .next build directory is ignored by Firebase CLI.
>
> Firebase CLI seems to ignore all hidden files, so I want to use a differently named directory.

The PR itself also contains some design discussion where the option was renamed from `NextConfig.options.dest` to `NextConfig.distDir` instead.

