import "../styles/base.scss";
import type { AppProps } from "next/app";
import { ColorModeProvider } from "../utils/colorMode";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ColorModeProvider>
      <Component {...pageProps} />
    </ColorModeProvider>
  );
}
