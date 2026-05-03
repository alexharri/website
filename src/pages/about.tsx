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
          Hello! I'm Alex Harri. I spend my evenings writing about software, mathematics, and
          design.
        </p>
        <p>
          I've been writing software professionally for 8 years. Right now I'm working full-time at{" "}
          <Link href="https://paper.design">Paper</Link> building tools for designers. The work is a
          fun blend of math, geometry, design, and performance — right in my wheelhouse.
        </p>
        <p>
          I'm a father to a wonderful daughter and I love physical activities of all kinds. At the
          moment I'm kind of obsessed with padel.
        </p>

        <h2 className={s("heading")}>Career</h2>
        <p>
          My first role was at <Link href="https://www.taktikal.com/">Taktikal</Link>. I was the
          first employee and front-end developer at Taktikal, and later led the front-end team as a
          Tech Lead. I was there for 4 years.
        </p>
        <p>
          In 2022 I joined <Link href="https://grid.is/">GRID</Link>. I mostly worked on their
          JavaScript-based spreadsheet engine. This role was heavy on data structures, algorithms,
          and{" "}
          <Link href="/blog/grid-engine-performance" target="_blank">
            performance
          </Link>
          .
        </p>
        <p>
          I later worked at <Link href="https://www.arkio.is/">Arkio</Link>, developing their 3D
          solid modeler written in C#. I worked on the modeling tools and geometry kernel — lots of
          computational geometry,{" "}
          <Link href="/blog/planes" target="_blank">
            math
          </Link>
          , and low-level performance work there.
        </p>
        <p>
          After Arkio I joined <Link href="https://neckcare.com/">NeckCare</Link> to work with some
          coworkers from GRID. I learned a lot about software architecture and testing while at
          NeckCare. While there I developed a{" "}
          <Link href="https://youtu.be/0_LX027Rskw?si=6qbV4P2kenS4BP4a&t=23">
            face-tracking solution
          </Link>{" "}
          for remote rehabilitation. Building that involved real-time computer vision, signal
          processing, and kinematics — the works!
        </p>

        <h2 className={s("heading")}>Writing</h2>
        <p>
          My most <Link href="https://news.ycombinator.com/item?id=46657122">popular</Link> post so
          far is{" "}
          <Link href="/blog/ascii-rendering" target="_blank">
            <em>"ASCII characters are not pixels: a deep dive into ASCII rendering"</em>
          </Link>
          , published early 2026. I spent half a year writing this post, and I'm very proud of the
          result.
        </p>
        <p>
          Another post I'm proud of is{" "}
          <Link href="/blog/clipboard" target="_blank">
            <em>"The web’s clipboard, and how it stores data of different types"</em>
          </Link>
          , which I wrote in 2024. It looks at the evolution of the web's clipboard APIs and their
          limitations.
        </p>
        <p>
          The first post I wrote (back in 2019) was{" "}
          <Link href="/blog/vector-networks" target="_blank">
            <em>"The Engineering behind Figma's Vector Networks"</em>
          </Link>
          . It's a lengthy post containing over 200 diagrams and illustrations. This post has
          created many opportunities for me over the years — opportunities that I otherwise would
          not have been considered for.
        </p>
        <p>
          I've written three posts about TypeScript, my favorite one being{" "}
          <Link href="/blog/typescript-structural-typing" target="_blank">
            <em>"Why doesn't TypeScript properly type Object.keys?"</em>
          </Link>
          . That post looks at TypeScript's structural type system through the lens of a common
          frustration most TypeScript developers have probably encountered.
        </p>
        <p>
          To view all of my posts, visit <Link href="/blog">/blog</Link>.
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
