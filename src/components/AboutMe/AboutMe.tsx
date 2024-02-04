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
          I write about software engineering topics, such as TypeScript, monorepos, and performance.
        </p>
        <p>
          I've been working as a software engineer in Iceland's vibrant startup scene for over 5
          years. My experience spans very early-stage startups (I was the first employee at{" "}
          <Link href="https://www.taktikal.com/">Taktikal</Link>) and Series A startups like{" "}
          <Link href="https://grid.is/">GRID</Link>.
        </p>
        <p>
          I'm currently working as a Senior Software Engineer at{" "}
          <Link href="https://arkio.is">Arkio</Link>, where I'm developing Arkio's modeling core.
          Arkio is a VR/AR-native solid modeler and model reviewer for architects supporting
          real-time collaboration.
        </p>
      </div>
    </section>
  );
};
