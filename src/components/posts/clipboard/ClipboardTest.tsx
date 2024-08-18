import { useEffect } from "react";

export const ClipboardTest: React.FC = () => {
  // Copy
  useEffect(() => {
    const listener = (e: ClipboardEvent) => {
      console.log("copy event fired", e.isTrusted);
      e.preventDefault();

      // Create JSON blob
      const json = JSON.stringify({ message: "Hello, world" });
      const jsonBlob = new Blob([json], { type: "application/json" });

      // Write JSON blob to clipboard as a Web Custom Format
      const clipboardItem = new ClipboardItem({
        [`web ${jsonBlob.type}`]: jsonBlob,
      });
      navigator.clipboard.write([clipboardItem]);

      if (!e.clipboardData) return;
      e.clipboardData.setData("text/plain", "Hello, world");
      e.clipboardData.setData("text/html", "<em>Hello, world</em>");
      e.clipboardData.setData("application/json", JSON.stringify({ type: "Hello, world" }));
      e.clipboardData.setData("foo bar baz", "Hello, world");
    };

    // document.body.addEventListener("copy", listener);

    // return () => {
    //   document.body.removeEventListener("copy", listener);
    // };
  }, []);

  // Paste
  useEffect(() => {
    const listener = async (e: ClipboardEvent) => {
      console.log("paste invoked");
      if (!e.clipboardData) return;
      for (const item of e.clipboardData.items) {
        const { kind, type } = item;
        if (kind === "string") {
          item.getAsString((content) => {
            console.log({ type, content });
          });
        }
      }

      // console.log("did paste");
      // e.preventDefault();
      // const text = e.clipboardData.getData("bla bla bla");
      // if (text) {
      //   console.log({ text });
      // }
    };

    document.body.addEventListener("paste", listener);

    return () => {
      document.body.removeEventListener("paste", listener);
    };
  }, []);

  // async function onClickCopy() {
  //   const textBlob = toBlob("text/plain", "Text to copy");
  //   // const htmlBlob = toBlob("text/html", "<b>What's up</b> man");
  //   navigator.clipboard.write([
  //     new ClipboardItem({
  //       [textBlob.type]: textBlob,
  //       // [htmlBlob.type]: htmlBlob,
  //     }),
  //   ]);
  // }

  // async function copyImage() {
  //   await ClipboardUtils.writeImageToClipboard(
  //     "/images/posts/clipboard/copy-paste-into-vscode.png",
  //   );
  // }

  // useEffect(() => {
  //   const timeout = setTimeout(async () => {
  //     console.log("reading");
  //     const items = await navigator.clipboard.read();
  //     for (const item of items) {
  //       console.log(item.types);
  //     }
  //   }, 1500);
  //   return () => clearTimeout(timeout);
  // }, []);

  async function test(_e: React.MouseEvent) {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes("web application/json")) {
        const blob = await item.getType("web application/json");
        const json = await blob.text();
        // Do stuff with JSON...
      }
    }
    // const items: ClipboardItem[] = await navigator.clipboard.read();
    // for (const item of items) {
    //   // console.log(item.types);
    //   for (const type of item.types) {
    //     const content = await (await item.getType(type)).text();
    //     console.log(type, content);
    //   }
    // }

    // const json = JSON.stringify({ message: "Hello" });
    // const jsonBlob = new Blob(["<script>alert('hacked')</script>"], {
    //   type: "text/plain",
    // });
    // console.log("execcmd");
    // document.execCommand("Copy", false, undefined);

    // Write JSON blob to clipboard
    // const clipboardItem = new ClipboardItem({ [jsonBlob.type]: jsonBlob });
    // await navigator.clipboard.write([clipboardItem]);
    // document.body.dispatchEvent(new ClipboardEvent("copy"));
    // document.dispatchEvent(new ClipboardEvent("paste"));

    // const items: ClipboardItem[] = await navigator.clipboard.read();
    // for (const item of items) {
    //   for (const type of item.types) {
    //     const content = await (await item.getType(type)).text();
    //     console.log({ type, content });
    //   }
    // }
  }

  return (
    <p>
      {/* <button style={{ color: "white", border: "1px solid white" }} onClick={onClickCopy}>
        Copy
      </button>
      <button style={{ color: "white", border: "1px solid white" }} onClick={copyImage}>
        Copy image
      </button> */}
      <button style={{ color: "white", border: "1px solid white" }} onClick={test}>
        Copy text
      </button>
    </p>
  );
};
