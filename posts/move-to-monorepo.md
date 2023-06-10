---
title: "Moving to a monorepo: Yes, but how?"
description: ""
publishedAt: ""
image: ""
---

Monorepos have been a hot topic in the JavaScript community for the past few years. There have been a lot of discussions about the pros and cons of monorepos.

If you've decided to move to a monorepo, it's not necessarily obvious how to go about it. There's lots of boilerplate examples online, but what if you want to move existing repositories?

This post is intended as a rough playbook for migrating existing repositories to a monorepo. Having merged a few repositories at two different companies, I've found a pretty good approach.


## Merging repositories

Instead of creating a new repository for the monorepo, I would recommend merging other repositories into an existing repository.

Given that we take this approach, we will be moving a separate repository (B) into the repository that will become the monorepo (A).

<Image src="~/move-a-into-b.png" />

I would pick the most active repository as the destination.

Reusing the repo minimizes disruptions to in-flight pull requests, and avoids having to set up the processes and settings for the repo again.


## Decide on the end result

Before the merge, decide what you want the directory structure to look like once the repositories have been merged.

Most repositories tend to look something like so:

```bash
# Main source code
src/

# External dependencies
package.json

# Various config files
tsconfig.json
```

While a multi-app monorepo looks like so:

```bash
# Apps
apps/[app-name]/

# Internal packages
packages/[package-name]/

# External dependencies
package.json

# Various config files
tsconfig.json
```

The difference is not that great:

 * Each `src/` directory moves into an app-specific directory `apps/[app-name]/`.
 * A `packages/` directory is created around shared code packages.

But this does not mean that the merge is trivial. Let's take a look at how to approach merging each of these:

 * The source code directory
 * External dependencies
 * Config files

## The source code directory

Most repositories contain a single directory, containing the application code for the project, while the configuration and build files typically live in the root or separate directories. We'll call this application code directory `src/`.

This application code is the easiest to merge. The application code for each repository is moved into the appropriate `apps/[app-name]` directory.

<Image src="~/src-directory.png" />

As a rule of thumb, we can consider each directory under `apps` to be an independently deployed project.

Some repositories may have multiple directories containing application code (e.g. Next.js projects with a `pages/` and `components/` directories), but those are migrated in the same manner as the `src/` directory in the example above.

## External dependencies

There are two ways to go about external dependencies in a monorepo.

 * A per-app version policy
 * A single-version policy

Under a per-app policy, each app specifies its own dependencies via its `package.json` file:

```bash
apps/app-a/
  package.json
  node_modules/

apps/app-b/
  package.json
  node_modules/
```

Migrating to a single-version policy is more involved. It will involve merging the list of dependencies for each project into a single list of dependencies.

<Image src="~/single-version-migration.png" />

Under a per-app version policy, the `package.json` files can mostly be migrated as-is in the same manner as the `src/` directory.

<Image src="~/per-app-version-migration.png" />

I would strongly advocate for a single-version policy for managing external dependencies.

Here are some reasons:

### Dependencies of shared code

The shared packages in your `packages/` directory will make use of external dependencies. But which versions of the dependencies should they use?

If packages don't specify their dependencies, then the API and behavior of those dependencies will be determined by the app that imported the package. That's a recipe for disaster, so your packages will need a fixed version for their dependencies.

This means that you will also need to decide whether to maintain a per-app or single-version policy for your packages:

 * Should all shared packages use the same version of dependencies, specified by the `package.json` in the root?
 * Or should each shared package specify its own dependencies via its `package.json`?


### Bundle size

When different packages can specify different version of dependencies, multiple version of dependencies may be included in the JS bundle sent to the client. This can easily go undetected.


### Singletons

A lot of libraries export singletons with shared state, for example the `Router` class in Next.js.

Singletons imported from such libraries are no longer guaranteed to be singletons globally. Each version of the library instantiates and exports its own singleton. This leads to very tricky bugs.


### Tech debt accumulation

When developers need to upgrade a dependency in one project, it's tempting to skip upgrading the dependency for all projects.

This inevitably leads to the dependencies of some projects slowly drifting out-of-date.


## TL;DR: Use a single-version policy

Under a single version policy, every app and every package use the same version of external dependencies. In addition to eliminating the aforementioned problems.

 * External dependencies work the same across every project, making working across projects easier.
 * Common logic across your applications can more easily be extracted to shared packages.
 * In being able to make more assumptions, tooling and infrastructure can be simplified.

The main drawback of a single version policy is that upgrading dependencies becomes harder. Every app and package making direct use of the dependency will need to be updated.

However, the difficulty of upgrades can be circumvented by creating packages that abstract away the API of external dependencies. Using this approach, only the package that is abstracting away the dependency needs to be touched.



## Config files

One of the core reason for moving to a monorepo tends to be reducing friction and making cross-project work easier. A developers moving from one project to another should be able to quickly get up to speed and be productive.

An obstacles to this may be the absence of familiar guardrails. Take the example of moving from a project with TypeScript's strict mode enabled, to one without. When neither the editor nor type checker provide the usual complaints about accessing properties of a potentially `null` object, the code written likely becomes less safe.

Diverging workflows and code standards across teams also increase friction. There will of course be differences across teams, but they do slow developers down.

With this in mind, project-specific configuration should be as minimal as possible. For your monorepo, create config files in the root and extend those in project-specific config files.

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./",
  },
  "include": ["src/**/*.ts"]
}
```

The project-specific config files should be kept as small and simple as possible.

So before merging the repositories, each repository will contain its own independent config files. We will want to combine config files that exist in both into common config files in the root. There will be some differences, which you can resolve by creating project-specific config files that extend the root and override as needed.

We will want to unify these configs and remove the overrides over time. However, don't try to do that right away.

Getting the merge done is hard enough. If you try to resolve all of the differences before merging, you will have a really hard time getting the merge done. Be practical and override where needed. The configs can be unified over time.

---

We now have a better sense of what the directory structure should look like, and how we’re going to deal with dependencies and config files.

We can now move onto the actual merge.

## Preparing for the merge

At first we have two independent repositories, `A` and `B`, which we intend to merge into a single repository. `A` has been designated to become the monorepo destination, so we will be merging `B` into `A`.

Create a branch in each repository where the directory structured is "as-if" the repositories were already merged. Make sure that everything still works (CI is green, scripts can be run).

Once the directory structure is ready, we have two "pre-merge" branches ready:

 * `prepare-merge-b` in repo `A`
 * `merge-into-a` in repo `B`

Before we merge them, let’s zoom out and understand what we want to happen.

<Image src="~/merge-overview.png" />

The process can be described like so:

 1. Create the pre-merge branches in `A` and `B`.
 2. Create a branch off the pre-merge branch in `A` and merge `B` into it (we'll get to how later).
 3. Resolve the differences and get everything working.

<Image src="~/merge-overview-annotated.png" />

Separating these stages makes the code review phase much easier, because the changes made in the different phases can be reviewed independently.

<Image src="~/merge-overview-diffs.png" />

 * Diff 1 and 2 enable reviewing the changes made when changing the directory structure.
 * Diff 3 enables reviewing the changes made in connecting `A` and `B` together and getting everything working.

Merging repositories is quite noisy, so making it easier to review the merge is very valuable.


## Merging the repositories

Copy-paste is not the way to go because the Git history would be lost. Git has a way to merge repositories without losing history.

Given that you are in repository `A`, you can merge `B` into `A` like so:

```bash
git checkout merge-b
git remote add app-b <URL of repo B>
git fetch app-b

git merge app-b/merge-into-a
    --allow-unrelated-histories
```

We can break this down like so:

```bash
# Go to the branch that we want to merge B into
git checkout merge-b

# Add repository B as a remote. In this example, we're
# adding B as a remote under the name `app-b`.
git remote add app-b <URL of repo B>

# Fetch the branches in B
git fetch app-b

# Merge the branch named `merge-into-a` from B (`app-b`)
# into the current branch
git merge app-b/merge-into-a
    # The `--allow-unrelated-histories` option is a way to
    # make Git allow us to merge A and B, despite them
    # sharing no history
    --allow-unrelated-histories
```


## After the merge

The `merge-b` branch now contains the files from repository B. The next step is getting everything hooked up and working.

Most notably, you will need to get the existing CI/CD pipelines for both projects working together. Once the CI pipelines are green and you've got everything working, we can put merge up for review.


## CI/CD in a monorepo

The hardest technical challenge for monorepos is the CI/CD pipeline. Over time, things will slow to a crawl under a _"run everything, always"_ approach.

You can test and build the apps in parallel to speed things up. However, this can get very expensive in CI minutes. At some point, monorepos have to start only running CI/CD for the apps affected by the change.

But be practical. While there are only two projects in the monorepo, running the CI pipelines for both apps while getting the monorepo is perfectly fine. But as the monorepo grows, this becomes untenable.


## Monorepo tooling

You don’t need a monorepo tool, though they certainly help.

I've had a positive experience with [Nx’s][nx] before. Its `print-affected` command allows you to see which apps were affected by the changes between two commits or branches. Really useful for CI/CD!

[nx]:https://nx.dev/

Nx has a suite of features geared towards monorepos. But keep in mind, you don’t have to buy into a monorepo tool wholesale. In the monorepo I set up at a previous workplace, we only used the `print-affected` command from Nx. Nothing else.

A notable competitor in the JS monorepo space has been [Turborepo][turborepo]. I don't have personal experience with it yet, but I've heard good things about it.

[turborepo]:https://turbo.build/


