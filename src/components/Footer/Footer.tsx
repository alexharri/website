import { LINKS } from "../../constants";
import { useStyles } from "../../utils/styles";
import { GitHubIcon20 } from "../Icon/GitHubIcon20";
import { LinkedInIcon20 } from "../Icon/LinkedInIcon20";
import { RSSIcon20 } from "../Icon/RSSIcon20";
import { Link } from "../Link";
import { FooterStyles } from "./Footer.styles";

export const Footer = () => {
  const s = useStyles(FooterStyles);

  return (
    <footer className={s("footer")}>
      <div className={s("inner")}>
        <div className={s("grid")}>
          <section>
            <p className={s("title")}>
              <a href="/">Alex Harri</a>
            </p>
            <p className={s("copyright")}>© 2024 Alex Harri Jónsson</p>
          </section>
          <section>
            <p className={s("sectionTitle")}>Links</p>
            <p className={s("link")}>
              <Link href={LINKS.GitHub}>
                <GitHubIcon20 />
                GitHub
              </Link>
            </p>
            <p className={s("link")}>
              <Link href={LINKS.LinkedIn}>
                <LinkedInIcon20 />
                LinkedIn
              </Link>
            </p>
            <p className={s("link")}>
              <Link href="/rss.xml" target="_blank">
                <RSSIcon20 />
                RSS
              </Link>
            </p>
          </section>
          <section>
            <p className={s("sectionTitle")}>Pages</p>
            <p className={s("link")}>
              <Link href="/">Home</Link>
            </p>
            <p className={s("link")}>
              <Link href="/about">About</Link>
            </p>
            <p className={s("link")}>
              <Link href="/blog">Blog</Link>
            </p>
            <p className={s("link")}>
              <Link href="/snippets">Snippets</Link>
            </p>
          </section>
        </div>
      </div>
    </footer>
  );
};
