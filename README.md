<div align="center"><img align="center" width="520" src="public/images/screenshots/webgl-gradient.png"></div>

<h1 align="center">
  alexharri.com
</h1>

<p align="center">
  <a href="https://alexharri.com" target="_blank">Home</a> · <a href="https://alexharri.com/blog" target="_blank">Blog</a> · <a href="https://alexharri.com/about" target="_blank">About</a>
</p>


## Notable posts

I've written over 15 posts on topics including TypeScript, mathematics, web APIs, performance and WebGL. Here are a few posts that I'm particularly proud of:

| Description | Screenshot |
|---|---|
| <p>[A flowing WebGL gradient, deconstructed][post_webgl]</p><p>An introduction to writing WebGL shaders using gradient noise and cool math using dozens of interactive examples.</p> | <img width="1000" src="public/images/screenshots/shaders-interactive-example.png"> |
| <p>[Planes in 3D space][post_planes]</p><p>Visual and interactive introduction to 2D planes in 3D space. Contains over 50 interactive examples and visualizations.</p> | <img width="1000" src="public/images/screenshots/planes-interactive-example.png"> |
| <p>[The web’s clipboard, and how it stores data of different types][post_clipboard]</p><p>Explores the web's clipboard APIs, their limitations, and their history.</p> | <img width="1000" src="public/images/screenshots/clipboard.png"> |
| <p>[Why doesn’t TypeScript properly type Object.keys?][post_structural_typing]</p><p>Introduces TypeScript's structural type system using a common TypeScript error as an entry point.</p> | <img width="1000" src="public/images/screenshots/code-example.png"> |

[post_webgl]: https://alexharri.com/blogz/webgl-gradients
[post_planes]: https://alexharri.com/blog/planes
[post_clipboard]: https://alexharri.com/blog/clipboard
[post_structural_typing]: https://alexharri.com/blog/typescript-structural-typing


## Implementation

This website is built using Next.js, React and TypeScript.

The [posts][posts] themselves are written as [MDX][mdx] files. MDX enables the use of React components in markdown, which I use to inject interactive components into my posts.

[posts]: https://github.com/alexharri/website/tree/master/posts
[mdx]: https://mdxjs.com/
