import { useEffect, useRef } from "react";
import { Layout } from "../components/Layout";
import { Link } from "../components/Link";
import { PostLayout } from "../components/PostLayout/PostLayout";
import { LINKS } from "../constants";
import { StyleOptions, useStyles } from "../utils/styles";

const images = [
  "/images/me/iceland.jpg",
  "/images/me/yellow-house.jpg",
  "/images/me/tent.jpg",
  "/images/me/waterfall.jpg",
  "/images/me/at-sea.jpg",
  "/images/me/budapest.jpg",
];
const N = images.length;
const IMG_W = 130;
const GAP = 32;
const TOTAL_W = IMG_W * N + GAP * N;

const Styles = ({ styled }: StyleOptions) => ({
  headline: styled.css`
    margin-bottom: 16px;
    text-align: center;
  `,

  heading: styled.css`
    margin-bottom: 8px;
    text-align: center;
  `,

  arkioVideo: styled.css`
    width: 400px;
    height: 230px;
    border: 1px solid red;
  `,

  imageCarousel: styled.css`
    margin: 0 auto 24px;
    height: 360px;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: ${GAP}px;
  `,

  imageContainer: styled.css`
    width: ${IMG_W}px;

    &:nth-child(1) > img {
      transform: translateX(0) rotate(2deg);
    }
    &:nth-child(2) > img {
      transform: translateX(0) rotate(-1deg);
    }
    &:nth-child(3) > img {
      transform: translateX(-3px) rotate(1.8deg);
    }
    &:nth-child(4) > img {
      transform: translateX(4px) rotate(0.3deg);
    }
    &:nth-child(5) > img {
      transform: translateX(7px) rotate(-1.4deg);
    }
    &:nth-child(6) > img {
      transform: translateX(-4px) rotate(0.8deg);
    }
  `,

  image: styled.css`
    width: 130px;
  `,

  blockImage: styled.css`
    max-width: 100%;
    margin: 0 auto;
    position: relative;
    padding: 8px 8px 0;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      transform: translateY(0px);
      background: #0e1e2b;
      z-index: -1;
      border-radius: 8px;
    }

    img {
      width: 100%;
    }
  `,

  show: styled.css`
    display: inline;
  `,

  obfuscate: styled.css`
    display: none;
  `,
});

export default function Page() {
  const s = useStyles(Styles);

  const imageCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const imageCarousel = imageCarouselRef.current;
    if (!imageCarousel) return;

    const items = [...imageCarousel.children] as HTMLDivElement[];

    let start = -1;

    let unmounted = false;
    const tick = () => {
      if (unmounted) return;
      requestAnimationFrame(tick);

      if (window.innerWidth > TOTAL_W - IMG_W) {
        imageCarousel.style.transform = "";
        for (const item of items) {
          item.style.transform = "";
        }
        start = -1;
        return;
      }

      if (start === -1) start = Date.now();
      const off = ((Date.now() - start) / 30) % TOTAL_W;

      imageCarousel.style.transform = `translateX(${off}px)`;

      for (const [i, item] of items.entries()) {
        const pos = off + (IMG_W + GAP) * i;
        const x = pos > TOTAL_W - (IMG_W + GAP) / 2 ? -TOTAL_W : 0;
        item.style.transform = `translateX(${x}px)`;
      }
    };
    tick();

    return () => {
      unmounted = true;
    };
  }, []);

  return (
    <Layout>
      <h1 className={s("headline")}>About me</h1>
      <PostLayout>
        <p>Hey, I'm Alex Harri.</p>
        <p>
          I write about software engineering topics like TypeScript, performance, and mathematics.{" "}
          <Link href="/blog">View blog</Link>.
        </p>
        <div className={s("imageCarousel")} ref={imageCarouselRef}>
          {images.map((image) => (
            <div key={image} className={s("imageContainer")}>
              <img src={image} className={s("image")} />
            </div>
          ))}
        </div>
        <h2 className={s("heading")}>Career</h2>
        <p>
          As a very early employee at <Link href="https://www.taktikal.com/">Taktikal</Link>—and
          subsequently as a Tech Lead—I built our first front-end applications, their supporting web
          services, and their CI/CD pipelines. That gave me valuable experience in building
          applications from scratch and maintaining them as they evolve. I worked at Taktikal for 4
          years.
        </p>
        <p>
          Over the past few years, I've transitioned to lower-level work developing and optimizing
          complex software where performance is critical.
        </p>
        <p>
          At <Link href="https://grid.is/">GRID</Link>, I worked on their JavaScript-based
          spreadsheet engine running in the browser, their formula parser written in Rust, and wrote
          some Python for the back-end.{" "}
          <Link href="/blog/grid-engine-performance" target="_blank">
            See <em>"Making GRID's spreadsheet engine 10% faster"</em>
          </Link>
          .
        </p>
        <p>
          In my current role at <Link href="https://www.arkio.is/">Arkio</Link> I've been working a
          lot with 3D geometry and math (
          <Link href="/blog/planes" target="_blank">
            see <em>"Planes in 3D space"</em>
          </Link>
          ). Arkio is an architectural{" "}
          <Link href="https://en.wikipedia.org/wiki/Solid_modeling">solid modeler</Link> running in
          VR headsets, written in C#. My work has mostly been on the core geometry layer and the
          editing tools (
          <Link href="/blog/arkio-pin-tool" target="_blank">
            see <em>"Introducing Arkio's Pin Tool"</em>
          </Link>
          ).
        </p>
        <h2 className={s("heading")}>Writing</h2>
        <p>
          I've written about topics ranging from performance and mathematics to TypeScript and
          monorepos.
        </p>
        <p>
          My first really popular post was{" "}
          <Link href="/blog/vector-networks" target="_blank">
            <em>"The Engineering behind Figma's Vector Networks"</em>
          </Link>
          , which I wrote back in 2019. It's a lengthy post covering multiple topics, and it
          contains more than 200 diagrams and illustrations.
        </p>
        <p>I've written three posts about TypeScript so far:</p>
        <ul>
          <li>
            <Link href="/blog/build-schema-language-with-infer" target="_blank">
              <em>"Build your own schema language with TypeScript's infer keyword"</em>
            </Link>{" "}
            is a deep dive into TypeScript's <code>infer</code> keyword.
          </li>
          <li>
            <Link href="/blog/typescript-structural-typing" target="_blank">
              <em>"Why doesn't TypeScript properly type Object.keys?"</em>
            </Link>{" "}
            looks at TypeScript's structural type system and its constraints.
          </li>
          <li>
            <Link href="/blog/jsdoc-as-an-alternative-typescript-syntax" target="_blank">
              <em>"JSDoc as an alternative TypeScript syntax"</em>
            </Link>{" "}
            explores how you can express TypeScript features using JSDoc comments.
          </li>
        </ul>
        <p>
          My first post containing interactive elements is{" "}
          <Link href="/blog/multi-cursor-code-editing-animated-introduction" target="_blank">
            <em>"Multi-cursor code editing: An animated introduction"</em>
          </Link>
          , which uses animated instances of the VS code editor to demonstrate uses cases and
          techniques for multi-cursor code editing.
        </p>
        <p>
          Another post containing a lot of interactivity is{" "}
          <Link href="/blog/planes" target="_blank">
            <em>"Planes in 3D space"</em>
          </Link>
          . It contains over 50 interactive 3D illustrations, intended to provide a visual and
          intuitive understanding of planes.
        </p>
        <p>
          I've also written about{" "}
          <Link href="/blog/move-to-monorepo" target="_blank">
            monorepos
          </Link>
          ,{" "}
          <Link href="/blog/grid-engine-performance" target="_blank">
            performance
          </Link>{" "}
          (
          <Link href="/blog/bit-set-iteration" target="_blank">
            twice
          </Link>
          ) , and{" "}
          <Link href="/blog/bit-sets" target="_blank">
            bit manipulation
          </Link>
          .
        </p>
        <h2 className={s("heading")}>Projects</h2>
        <p>
          My personal projects can be found on{" "}
          <Link href="https://github.com/alexharri">my GitHub page</Link>.
        </p>
        <p>
          Notable project include an{" "}
          <Link href="https://github.com/alexharri/animation-editor">animation editor</Link>, a
          helper for Icelandic name declension called{" "}
          <Link href="https://github.com/alexharri/beygla">Beygla</Link>, an experimental schema
          builder called <Link href="https://github.com/alexharri/strema">Strema</Link>, and{" "}
          <Link href="https://github.com/alexharri/website">this website</Link>.
        </p>
        <h2 className={s("heading")}>Contact</h2>
        <p>
          You can contact me via a message on <Link href={LINKS.LinkedIn}>LinkedIn</Link> or by
          sending me an email (you can find my email address on my GitHub page).
        </p>
      </PostLayout>
    </Layout>
  );
}
