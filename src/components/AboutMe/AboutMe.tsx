import { useStyles } from "../../utils/styles";
import { Link } from "../Link";
import { AboutMeStyles } from "./AboutMe.styles";

export const AboutMe = () => {
  const s = useStyles(AboutMeStyles);

  return (
    <section className={s("container")}>
      <div className={s("left")}>
        <img src="/images/me.png" className={s("image")} />
      </div>
      <div className={s("right")}>
        <p>Hey, I'm Alex Harri.</p>
        <p>
          I write about software engineering topics like TypeScript, monorepos, performance, and
          mathematics.
        </p>
        <p>
          I've been working as a software engineer in Iceland's vibrant startup scene for over 6
          years. I'm currently working as a senior software engineer at Arkio, where I'm developing
          Arkio's geometry core and editing tools.
        </p>
        <p>
          You can read more about me, my writing, and my projects on my{" "}
          <Link href="/about">about page</Link>.
        </p>
      </div>
    </section>
  );
};
