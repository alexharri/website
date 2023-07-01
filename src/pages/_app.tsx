import "../styles/globalStyles";
import type { AppProps } from "next/app";
import { DefaultMeta } from "../components/DefaultMeta";
import { OperatingSystemProvider } from "../components/OperatingSystem/OperatingSystem";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultMeta />
      <OperatingSystemProvider>
        <Component {...pageProps} />
      </OperatingSystemProvider>
    </>
  );
}
