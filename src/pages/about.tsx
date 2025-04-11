import Head from "next/head";
import { Layout } from "../components/Layout";
import { Link } from "../components/Link";
import { PostLayout } from "../components/PostLayout/PostLayout";
import { LINKS } from "../constants";
import { StyleOptions, useStyles } from "../utils/styles";

const Styles = ({ styled }: StyleOptions) => ({
  imageWrapper: styled.css`
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  `,

  headline: styled.css`
    text-align: center;
    margin-bottom: 8px;
  `,

  heading: styled.css`
    margin-bottom: 8px;
    text-align: center;
  `,

  image: styled.css`
    width: 160px;
    border-radius: 8px;
    margin: 0 auto;
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

  return (
    <Layout>
      <Head>
        <title>About me | Alex Harri Jónsson</title>
      </Head>
      <PostLayout>
        <div className={s("imageWrapper")}>
          <img src="/images/me.png" alt="An image of me" className={s("image")} />
        </div>

        <h1 className={s("headline")}>About me</h1>
        <p>
          Hey, I'm Alex. I'm super interested in software & design — I've been writing about
          software-adjacent topics since 2019 (<Link href="/blog">see blog</Link>
          ).
        </p>
        <p>
          I've been working as a software developer since early 2018, mostly at early-stage
          startups. I'm currently working at <Link href="https://neckcare.com/">NeckCare</Link>.
        </p>
        <p>
          Aside from that, I'm a soon-to-be father of one and I love physical activities of all
          forms — I've been playing <Link href="https://en.wikipedia.org/wiki/Padel">padel</Link> a
          lot lately with friends from GRID.
        </p>

        <h2 className={s("heading")}>Career</h2>
        <p>
          As a very early employee at <Link href="https://www.taktikal.com/">Taktikal</Link>, and
          subsequently as a Tech Lead, I played a big part in the development of Taktikal's first
          products. I worked there for 4 years. Those were incredibly formative years — I gained
          invaluable experience in building applications from scratch and maintaining them as they
          evolve.
        </p>
        <p>
          I joined <Link href="https://grid.is/">GRID</Link> in 2022. I worked on their
          JavaScript-based spreadsheet engine running in the browser, their formula parser written
          in Rust, and I wrote some Python for the back-end.{" "}
          <Link href="/blog/grid-engine-performance" target="_blank">
            See <em>"Making GRID's spreadsheet engine 10% faster"</em>
          </Link>
          .
        </p>
        <p>
          After GRID, I spent a year and a half developing{" "}
          <Link href="https://www.arkio.is/">Arkio's</Link> modeling tools (Arkio is an
          architectural modeler and model reviewer written in C#). I learned a ton of 3D geometry
          and mathematics there. A few months into the job I wrote{" "}
          <Link href="/blog/planes" target="_blank">
            <em>"Planes in 3D space"</em>
          </Link>{" "}
          to share what I learned about the math behind planes.
        </p>
        <p>
          I'm now working at <Link href="https://neckcare.com/">NeckCare</Link> with two of my
          coworkers from GRID — they, and the rest of the team at NeckCare, are awesome people to
          work with. I'm enjoying life a lot right now.
        </p>
        <h2 className={s("heading")}>Writing</h2>
        <p>
          My most popular post so far has been{" "}
          <Link href="/blog/clipboard" target="_blank">
            <em>"The web’s clipboard, and how it stores data of different types"</em>
          </Link>
          , which I wrote in 2024. It looks at the evolution of the web's clipboard APIs and their
          limitations.
        </p>
        <p>
          My first post of note was{" "}
          <Link href="/blog/vector-networks" target="_blank">
            <em>"The Engineering behind Figma's Vector Networks"</em>
          </Link>
          . It's a <em>lengthy</em> post covering many topics, containing over 200 diagrams and
          illustrations.
        </p>
        <p>
          The first post I wrote containing interactive elements is{" "}
          <Link href="/blog/multi-cursor-code-editing-animated-introduction" target="_blank">
            <em>"Multi-cursor code editing: An animated introduction"</em>
          </Link>
          . Written in 2022, it uses animated instances of the VS code editor to demonstrate use
          cases and techniques for multi-cursor code editing. This was quite a popular post!
        </p>
        <p>
          I'm incredibly proud of my work on{" "}
          <Link href="/blog/planes" target="_blank">
            <em>"Planes in 3D space"</em>
          </Link>
          . That post contains over 50 interactive 3D illustrations, intended to provide a visual
          and intuitive understanding of planes.
        </p>
        <p>I've written three posts about TypeScript:</p>
        <ul>
          <li>
            <Link href="/blog/typescript-structural-typing" target="_blank">
              <em>"Why doesn't TypeScript properly type Object.keys?"</em>
            </Link>{" "}
            looks at TypeScript's structural type system and its constraints. This one was very
            popular.
          </li>
          <li>
            <Link href="/blog/build-schema-language-with-infer" target="_blank">
              <em>"Build your own schema language with TypeScript's infer keyword"</em>
            </Link>{" "}
            is a deep dive into TypeScript's <code>infer</code> keyword.
          </li>
          <li>
            <Link href="/blog/jsdoc-as-an-alternative-typescript-syntax" target="_blank">
              <em>"JSDoc as an alternative TypeScript syntax"</em>
            </Link>{" "}
            explores how you can express TypeScript features using JSDoc comments. This one gets a
            lot of traffic from Google, people look this up quite a bit.
          </li>
        </ul>
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
          Many of my personal projects, including{" "}
          <Link href="https://github.com/alexharri/website">this website</Link>, can be found on my{" "}
          <Link href="https://github.com/alexharri">GitHub page</Link>.
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
