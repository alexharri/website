import "../styles/base.scss";
import type { AppProps } from "next/app";
import { ColorModeProvider } from "../utils/colorMode";
import { DefaultMeta } from "../components/DefaultMeta";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultMeta />
      <ColorModeProvider>
        <Component {...pageProps} />
      </ColorModeProvider>
    </>
  );
}
