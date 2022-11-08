import { Link } from "../Link";

export const AboutMe = () => {
  return (
    <>
      <h2>About me</h2>
      <p>
        My name is Alex Harri. I'm a software developer from Reykjavík, Iceland.
      </p>
      <p>
        <Link href="https://github.com/alexharri">GitHub</Link>,{" "}
        <Link href="https://alexharri.medium.com/">Medium</Link>,{" "}
        <Link href="https://www.linkedin.com/in/alex-harri-j%C3%B3nsson-b1273613b/">
          LinkedIn
        </Link>
      </p>
    </>
  );
};
