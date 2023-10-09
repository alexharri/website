import { useStyles } from "../../utils/styles";
import { Link } from "../Link";
import { AboutMeStyles } from "./AboutMe.styles";

export const AboutMe = () => {
  const s = useStyles(AboutMeStyles);

  return (
    <div className={s("container")}>
      <div className={s("left")}>
        <img src="/images/me.png" className={s("image")} />
      </div>
      <div className={s("right")}>
        <h2>About me</h2>
        <p>Hey, my name is Alex Harri Jónsson. Welcome to my personal website and blog!</p>
        <p className={s("links")}>
          <Link href="https://github.com/alexharri">GitHub</Link>
          <span data-dot />
          <Link href="https://www.linkedin.com/in/alex-harri-j%C3%B3nsson-b1273613b/">
            LinkedIn
          </Link>
          <span data-dot />
          <Link href="https://alexharri.medium.com/">Medium</Link>
        </p>
      </div>
    </div>
  );
};
