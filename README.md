<h1 align="center">
  <a href="https://alexharri.com">alexharri.com</a>
</h1>

<p align="center">
  Source code for my personal website and blog. 
</p>

## My writing

I mostly write about topics relating to web development. I've written about TypeScript, monorepos, multi-cursor editing and performance.

 - [Why doesn't TypeScript properly type Object.keys?](https://alexharri.com/blog/typescript-structural-typing)
 - [Multi-cursor code editing: An animated introduction](https://alexharri.com/blog/multi-cursor-code-editing-animated-introduction)
 - [Build your own schema language with TypeScript's infer keyword](https://alexharri.com/blog/build-schema-language-with-infer)
 - [Making GRID's spreadsheet engine 10% faster](https://alexharri.com/blog/grid-engine-performance)

## Technical implementation

This website is written in TypeScript and React using Next.js.

The [blog posts][posts] themselves are written as [MDX](https://mdxjs.com/) files. MDX enables the use of React components in markdown:

[posts]: https://github.com/alexharri/website/tree/master/posts

```md
<Note type="info">
  Here is a note
</Note>
```

This is used to add the interactive components seen in posts such as [Multi-cursor code editing: An animated introduction](https://alexharri.com/blog/multi-cursor-code-editing-animated-introduction).
