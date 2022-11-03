import Document, { Html, Head, Main, NextScript } from "next/document";
import { initColorsScript, defaultColorsStyles } from "../utils/initColors";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        {/* The style tag provides default colors to browser that do not support JS */}
        <style dangerouslySetInnerHTML={{ __html: defaultColorsStyles }} />
        <script dangerouslySetInnerHTML={{ __html: initColorsScript }} />
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
