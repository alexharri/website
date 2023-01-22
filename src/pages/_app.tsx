import "../styles/base.scss";
import type { AppProps } from "next/app";
import { ColorModeProvider } from "../utils/colorMode";
import { DefaultMeta } from "../components/DefaultMeta";
import { OperatingSystemProvider } from "../components/OperatingSystem/OperatingSystem";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultMeta />
      <ColorModeProvider>
        <OperatingSystemProvider>
          <Component {...pageProps} />
        </OperatingSystemProvider>
      </ColorModeProvider>
    </>
  );
}
