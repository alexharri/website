---
title: "Searching for and navigating Git commits"
description: ""
image: ""
publishedAt: ""
tags: []
---

I sometimes encounter code that puzzles me. When that happens, it's usually because I lack some context. Perhaps the code is that way because of a bug fix that's not immediately obvious at a glance, or maybe there's some constraint I'm not aware of.

To get more context, I often use [Git blame][git_blame] to view the commit (and usually, the associated pull request) that added the code.

[git_blame]: https://git-scm.com/docs/git-blame

Sometimes the pull request has a description (or a link to an issue with one) which clarifies the change, or discussions added during code review—those are super valuable. Often the commit itself contains related changes that provide context to the code.

But it's not always that straightforward. Sometimes the commit that Git blame points to is not the change that introduced the behavior. Examples of such commits are refactors or formatting changes. I used to solve this by repeatedly `git blame`ing and reading diff after diff, which was _terribly_ laborious and time consuming. I recently encountered a particularly tough case and got fed up enough that I decided to do something about it.

In this post, I'll share with you the tools I found so that you can effectively search for and navigate Git commits. You'll learn a lot about Git along the way!


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
<@text200>▶</@> <@text400>git blame example.js</@> <@cli-arg>-s -L 7,9</@>

<@commit>1edd8004</@> <@text200>7)</@>  <~js>if (MPP_ACTIVE === "true") {</~>
<@commit>c457405a</@> <@text200>8)</@>  <~js>  doSomeFunkyStuff();</~>
<@commit>c457405a</@> <@text200>9)</@>  <~js>}</~>
```

<SmallNote>The `-s` option strips author and date information. `-L` selects specific lines.</SmallNote>

Let's take a look at the commit for line 7, which seems to be add the `MPP_ACTIVE` check:

<Image src="~/git-blame-commit-0.png" width={540} />

Hmm, no, that's not it—that's just a refactoring change. We need to go further back to find the change that introduced the condition itself.

To do that, we might repeat the process and run Git blame again on the prior version of the file. Let's keep going and see what we get.

<p align="center">What we find is a refactoring change...</p>

<Image src="~/git-commit-1.png" width={420} />

<p align="center">...another refactoring change...</p>

<Image src="~/git-commit-2.png" width={420} />

<p align="center">...and a change just moving things around.</p>

<Image src="~/git-commit-3.png" width={420} />

We don't care about these changes. What we care about is the commit where the `MPP_ACTIVE` condition was introduced.

Ideally, we'd be able to search for commits that mentions `MPP_ACTIVE` and just look at the earliest one. That is exactly what `git log -S` lets us do.


## Searching for commits by code

By default, `git log` lists every commit in your branch. The `-S` option lets us pass a string used to filter out commits whose diffs don't include that specific string.

```
<@token.comment># Show commits that include "getUser" in the diff</@>
git log <@cli-arg>-S</@> <@token.string>"getUser"</@>
```

<SmallNote>The string passed to `-S` is case-sensitive. `getUser` will not match `GetUser`.</SmallNote>

More specifically, the `-S` option must match some code that was added or deleted for the commit to be listed. As a mental model, you can imagine this option being implemented like so:

```ts
if (typeof args.S === "string") {
  commits = commits.filter(commit => (
    commit.additions.includes(args.S) ||
    commit.deletions.includes(args.S)
  ));
}
```

This means that commits that just happened to move lines of code including our search string are _not_ included—the exact code we're searching for needs to have been added/deleted in the commit for it to be shown. Very useful for our purposes! 

Let's try running `git log -S "MPP_ACTIVE"` and see what we get:

```
<@text200>▶</@> <@text400>git log</@> <@cli-arg>-S</@> <@token.string>"MPP_ACTIVE"</@>

<@text400>commit</@> <@commit>33a8b6ea050963e452b1d16165f64a77df3ff054</@>
<@text400>Author: johndoe42 <j.doe@company.com></@>
<@text400>Date:   Tue Sept 14 14:05:52 2022 +0000</@>

    refactor

<@text400>commit</@> <@commit>8fed03eadf2afc5efe91ddf0cf7a7837c8b680fe</@>
<@text400>Author: aliceb76 <aliceb@company.com></@>
<@text400>Date:   Mon Jan 19 10:44:19 2021 +0000</@>

    do funky stuff if MPP_ACTIVE is set
```

I find the default output format far too verbose, so I almost always use `--oneline` to compact it:

```
<@text200>▶</@> <@text400>git log</@> <@cli-arg>-S</@> <@token.string>"MPP_ACTIVE"</@> <@cli-arg>--oneline</@>

<@commit>33a8b6e</@> refactor
<@commit>8fed03e</@> do funky stuff if MPP_ACTIVE is set
```

<SmallNote label="" center>Much nicer!</SmallNote>

The commits returned from `git log` are ordered from newest to oldest, which means that `8fed03e` is the first commit in the codebase that mentioned `MPP_ACTIVE`. It turns out that commit is exactly the one we were looking for!

<Image src="~/git-commit-4.png" width={460} plain />
<SmallNote label="" center>Hooray!</SmallNote>

Let's move past this toy example and try `git log -S` on a larger codebase. I'll use the Next.js codebase as an example and try and finding the commit that implemented a specific feature.


## Using `git log -S` in larger codebases

The [vercel/next.js codebase][next_codebase] has over 25,000 commits added over 8 years, so it's a fairly large and mature codebase! Next.js has a [`distDir` option][distdir] that allows the user to specify a custom build directory. Let's try finding the commit that added this option.

[next_codebase]: https://github.com/vercel/next.js
[distdir]: https://nextjs.org/docs/pages/api-reference/next-config-js/distDir

As a first step, let's run `git log -S "distDir"` and see what we get:

```
<@text200>▶</@> <@text400>git log</@> <@cli-arg>-S</@> <@token.string>"distDir"</@> <@cli-arg>--oneline</@>

<@commit>5c1828bdd6</@> Handle source map <@text200>[...]</@> chunks <@text200>(#71168)</@>
<@commit>d8c0539b08</@> fix: allow custom <@text200>[...]</@> conventions <@text200>(#71153)</@>
<@commit>490704430b</@> Add source map <@text200>[...]</@> the browser <@text200>(#71042)</@>
<@commit>13f8fcbb6b</@> [Turbopack] Implement <@text200>[...]</@> `stats.json` <@text200>(#70996)</@>
<@commit>3b9889e1d8</@> [Turbopack] add new backend (#69667)
<@commit>30789cc19f</@> Auto rotate Server <@text200>[...]</@> periodically <@text200>(#70516)</@>
<@commit>0539477e7c</@> types: improve napi binding <@text200>[...]</@> types <@text200>(#69680)</@>
<@text400>...over 400 more commits</@>
```

Hmm... these are all recent commits. `git log` orders commits from most recent to oldest by default. We want to find the earliest mentions of `distDir` so we'd like the older commits to come first.

`git log` has a handy `--reverse` flag just for that purpose.

```
<@text200>▶</@> <@text400>git log</@> <@cli-arg>-S</@> <@token.string>"distDir"</@> <@cli-arg>--oneline --reverse</@>

<@commit>acc1983f80</@> Don't delete <@text200>[...]</@> before a replacement is built <@text200>(#1139)</@>
<@commit>141ab99888</@> build on tmp dir <@text200>(#1150)</@>
<@commit>9347c8bdd0</@> Specify a different build directory for #1513 <@text200>(#1599)</@>
<@commit>8d2bbf940d</@> Refactor the build server to remove tie to fs <@text200>(#1656)</@>
<@commit>dec85fe6c4</@> Add CDN support with assetPrefix <@text200>(#1700)</@>
<@commit>cb635dd9a5</@> use configured distDir where required <@text200>(#1816)</@>
<@commit>ca9146c421</@> support custom build directory in next export <@text200>(#2135)</@>
<@text400>...over 400 more commits</@>
```

Nice! This gives us the first commits in `vercel/next.js` mentioning `distDir`.

It's not necessarily obvious which one we care about. Let's look at some tools at our disposal to analyze these commits at a high level to quickly figure out which one of them we care about.


## Commits at a glance

Reading the full diffs of the commits via `git diff` would be exhausting. One quick way to get a feel for a commit is to view the files that a commit touched, which we can do via `git show <commit> --stat`. Let's try that on the first commit in the list:

```
<@text200>▶</@> <@text400>git show</@> <@commit>acc1983f80</@> <@cli-arg>--stat --oneline</@>

<@commit>acc1983f80</@> Don't delete `.next` folder before a replacement is built <@text200>(#1139)</@>
 <@text700>.gitignore</@>              <@text200>|</@>  3 <@green>++</@><@red>-</@>
 <@text700>server/build/clean.js</@>   <@text200>|</@>  4 <@green>++</@><@red>--</@>
 <@text700>server/build/gzip.js</@>    <@text200>|</@>  4 <@green>++</@><@red>--</@>
 <@text700>server/build/index.js</@>   <@text200>|</@> 19 <@green>+++++++++++</@><@red>--------</@>
 <@text700>server/build/replace.js</@> <@text200>|</@> 18 <@green>++++++++++++++++++</@>
 <@text700>server/build/webpack.js</@> <@text200>|</@>  4 <@green>++</@><@red>--</@>
 <@text700>server/hot-reloader.js</@>  <@text200>|</@>  2 <@green>+</@><@red>-</@>
 7 files changed, 38 insertions(<@green>+</@>), 16 deletions(<@red>-</@>)
```

<SmallNote>The `--oneline` option works the same as in `git log`, compacting the commit log.</SmallNote>

This quickly gives us a sense of which files are being changed, and how much.

We can narrow this down even further with the `-S` option, just like in `git log`. Using `--stat` in conjuction with `-S "distDir"` will show us only those touched files whose diff includes `distDir`:

```
<@text200>▶</@> <@text400>git show</@> <@commit>acc1983f80</@> <@cli-arg>--stat --oneline -S</@> <@token.string>"distDir"</@>

<@commit>acc1983f80</@> Don't delete `.next` folder before a replacement is built <@text200>(#1139)</@>
 <@text700>server/build/replace.js</@> <@text200>|</@> 18 <@green>++++++++++++++++++</@>
 1 file changed, 18 insertions(<@green>+</@>)
```

That certainly narrows it down! Let's view the diff for `server/build/replace.js`, which we can do via `show <commit> -- <file>`:

```
<@text200>▶</@> <@text400>git show</@> <@commit>acc1983f80</@> <@cli-arg>-- server/build/replace.js</@>

<@text200>+++</@> <@text700>b/server/build/replace.js</@>
<@text200>@@ -0,0 +1,18 @@</@>
<@green>+</@>
<@green>+</@>  <~js>const distDir = path.resolve(dir, distFolder);</~>
<@green>+</@>  <~js>const buildDir = path.resolve(dir, buildFolder);</~>
<@green>+</@>
```

<SmallNote center>I've shortened the output for clarity.</SmallNote>

Hmm, `distDir` is just a local variable name in this commit. Let's keep looking.

The next commit of interest seems to be `9347c8bdd0`, which talks about specifying a build directory:

```
<@text200>▶</@> <@text400>git log</@> <@cli-arg>-S</@> <@token.string>"distDir"</@> <@cli-arg>--oneline --reverse</@>

<@commit>acc1983f80</@> Don't delete `.next` folder before a replacement is built <@text200>(#1139)</@>
<@commit>141ab99888</@> build on tmp dir <@text200>(#1150)</@>
<@commit>9347c8bdd0</@> Specify a different build directory for #1513 <@text200>(#1599)</@>
<@text200>...</@>
```

As a first step, we look at a summary of which files changed via `show --stat`:

```
<@text200>▶</@> <@text400>git show</@> <@commit>9347c8bdd0</@> <@cli-arg>--stat --oneline</@>

<@commit>9347c8bdd0</@> Specify a different build directory for #1513 <@text200>(#1599)</@>
 <@text700>.gitignore</@>            <@text200>|</@>  2 <@green>++</@>
 <@text700>bin/next-build</@>        <@text200>|</@>  5 <@green>+++</@><@red>--</@>
 <@text700>bin/next-dev</@>          <@text200>|</@>  5 <@green>+++</@><@red>--</@>
 <@text700>bin/next-start</@>        <@text200>|</@>  9 <@green>++++++</@><@red>---</@>
 <@text700>readme.md</@>             <@text200>|</@> 13 <@green>++++++++++++</@><@red>-</@>
 <@text700>server/build/clean.js</@> <@text200>|</@>  4 <@green>+++</@><@red>-</@>
 <@text200>...9 more files</@>
 15 files changed, 128 insertions(<@green>+</@>), 34 deletions(<@red>-</@>)
```

We can narrow this list of changes by only showing files whose diff includes `distDir` via the `-S` option:

```
<@text200>▶</@> <@text400>git show</@> <@commit>9347c8bdd0</@> <@cli-arg>--stat --oneline -S</@> <@token.string>"distDir"</@>

<@commit>9347c8bdd0</@> Specify a different build directory for #1513 <@text200>(#1599)</@>
 <@text700>bin/next-start</@>          <@text200>|</@>  9 <@green>++++++</@><@red>---</@>
 <@text700>readme.md</@>               <@text200>|</@> 13 <@green>++++++++++++</@><@red>-</@>
 <@text700>server/build/clean.js</@>   <@text200>|</@>  4 <@green>+++</@><@red>-</@>
 <@text700>server/build/index.js</@>   <@text200>|</@> 19 <@green>++++++++++++</@><@red>-------</@>
 <@text700>server/build/replace.js</@> <@text200>|</@>  9 <@green>++++++</@><@red>---</@>
 <@text700>server/build/webpack.js</@> <@text200>|</@>  2 <@green>+</@><@red>-</@>
 <@text200>...4 more files</@>
 10 files changed, 68 insertions(<@green>+</@>), 30 deletions(<@red>-</@>)
```

This looks promising! Let's start looking at some diffs to see if this is the commit we're looking for. We can do that in two ways:

 1. Look at the diff for a specific file via `show <commit> -- <file>`, or
 2. look at diffs for all files that mention `distDir` via `show <commit> -S <code>`.

Since we don't know which file to look at, let's look at all of the files. After scrolling a bit, this addition to `readme.md` crops up:

```
<@text200>▶</@> <@text400>git show</@> <@commit>9347c8bdd0</@> <@cli-arg>-S</@> <@token.string>"distDir"</@> <@cli-arg>--oneline</@>

<@text200>+++</@> <@text700>b/readme.md</@>
<@text200>@@ -644,6 +644,17 @@</@>
<@green>+</@> <~md>#### Setting a custom build directory</~>
<@green>+</@> 
<@green>+</@> <@text400>You can specify a name to use for a custom build directory. For</@>
<@green>+</@> <@text400>example, the following config will create a `build` folder instead</@>
<@green>+</@> <@text400>of a `.next` folder. If no configuration is specified then next</@>
<@green>+</@> <@text400>will create a `.next` folder.</@>
<@green>+</@> 
<@green>+</@>     <~js>// next.config.js</~>
<@green>+</@>     <~js>module.exports = {</~>
<@green>+</@>     <~js>  distDir: 'build'</~>
<@green>+</@>     <~js>}</~>
```

Looks like `9347c8bdd0` was the commit that added this option! Opening the commit on GitHub shows us the [associated Pull Request][PR_1599], which also links to the [issue requesting the feature][issue_1513].

The issue provides us with the original motive for adding `distDir` as an option:

[PR_1599]: https://github.com/vercel/next.js/pull/1599
[issue_1513]: https://github.com/vercel/next.js/issues/1513

> I am trying to deploy next to Firebase functions, and it looks like the .next build directory is ignored by Firebase CLI.
>
> Firebase CLI seems to ignore all hidden files, so I want to use a differently named directory.

The PR itself also contains some design discussion where the option was renamed from `NextConfig.options.dest` to `NextConfig.distDir` instead.


