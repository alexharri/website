import Document, { Html, Head, Main, NextScript } from "next/document";
import { initColorsScript, defaultColorsStyles } from "../utils/initColors";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        {/* The style tag provides default colors to browser that do not support JS */}
        <style dangerouslySetInnerHTML={{ __html: defaultColorsStyles }} />
        <script dangerouslySetInnerHTML={{ __html: initColorsScript }} />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />

        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
