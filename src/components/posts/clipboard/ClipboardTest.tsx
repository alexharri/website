import { useEffect } from "react";
import { ClipboardUtils } from "../../../utils/clipboard";

function toBlob(type: string, content: string) {
  const bytes = new TextEncoder().encode(content);
  return new Blob([bytes], { type });
}

export const ClipboardTest: React.FC = () => {
  // Copy
  useEffect(() => {
    const listener = (e: ClipboardEvent) => {
      console.log("copy event fired", e.isTrusted);
      e.preventDefault();
      if (!e.clipboardData) return;
      e.clipboardData.setData("text/plain", "this is text");
      e.clipboardData.setData("text/html", "<em>5</em>");
      e.clipboardData.setData("application/octet-stream", JSON.stringify({ type: "hello" }));
      // e.clipboardData.setData("bla what", "foo bar");
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

  async function onClickCopy() {
    const textBlob = toBlob("text/plain", "Text to copy");
    // const htmlBlob = toBlob("text/html", "<b>What's up</b> man");
    navigator.clipboard.write([
      new ClipboardItem({
        [textBlob.type]: textBlob,
        // [htmlBlob.type]: htmlBlob,
      }),
    ]);
  }

  async function copyImage() {
    await ClipboardUtils.writeImageToClipboard(
      "/images/posts/clipboard/copy-paste-into-vscode.png",
    );
  }

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

  async function figdownload() {
    // const items: ClipboardItem[] = await navigator.clipboard.read();
    // for (const item of items) {
    //   console.log(item.types);
    // }
    const data =
      "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";
    // await ClipboardUtils.writeJsonToClipboard({ type: "hello" }, "web text/plain");

    const b64toBlob = (b64Data: any, contentType = "", sliceSize = 512) => {
      const byteCharacters = atob(b64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: contentType });
      return blob;
    };

    const blob = b64toBlob(data, "application/octet-stream");
    console.log(URL.createObjectURL(blob));
  }

  async function test(e: React.MouseEvent) {
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
    console.log("execcmd");
    document.execCommand("Copy", false, undefined);

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

  useEffect(() => {
    const btn = window.testbtn as HTMLElement;
    const listener = () => {
      const input = document.createElement("input");
      input.value = "Content";
      document.body.appendChild(input);
      input.select();

      console.log("executed copy");
      document.execCommand("Copy", false, undefined);

      document.body.removeChild(input);
    };

    setTimeout(() => {
      listener();
    }, 1500);

    btn.addEventListener("mouseup", listener);
    return () => {
      btn.removeEventListener("mouseup", listener);
    };
  }, []);

  function paste() {
    console.log("paste");
    document.execCommand("paste");
  }

  return (
    <p>
      {/* <button style={{ color: "white", border: "1px solid white" }} onClick={onClickCopy}>
        Copy
      </button>
      <button style={{ color: "white", border: "1px solid white" }} onClick={copyImage}>
        Copy image
      </button> */}
      <button id="testbtn" style={{ color: "white", border: "1px solid white" }}>
        Copy text
      </button>
      <button style={{ color: "white", border: "1px solid white" }} onClick={figdownload}>
        Figdownload
      </button>
    </p>
  );
};
