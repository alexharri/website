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
        <p>
          Hey, I'm Alex. I'm super interested in software and design. I've been writing about
          software-related topics since 2019.
        </p>
        <p>
          You can find my writing on{" "}
          <Link href="/blog">
            <span className="monospace">/blog</span>
          </Link>{" "}
          and learn about me on my{" "}
          <Link href="/about">
            <span className="monospace">/about</span>
          </Link>{" "}
          page .
        </p>
      </div>
    </section>
  );
};
