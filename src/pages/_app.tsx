import "../styles/globals.scss";
import type { AppProps } from "next/app";
import { useListenToColorModeChanges } from "../utils/colorMode";

export default function App({ Component, pageProps }: AppProps) {
  useListenToColorModeChanges();

  return <Component {...pageProps} />;
}
