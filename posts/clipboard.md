---
title: "Untitled post on Clipboard"
description: ""
image: ""
publishedAt: ""
---

## Using the async Clipboard API

If I copy some paragraphs from a website and paste it into Google Docs, some of the content's formatting is retained, such as links, font size, and color.

<Image src="~/copy-paste-rich-content.png" plain />

But if I open VS Code and paste there, only the raw text content is pasted.

<Image src="~/copy-paste-into-vscode.png" />

The clipboard serves these two uses cases by allowing information to be stored in multiple [_representations_][list_of_representations] associated with MIME types. The Clipboard spec [mandates][mandatory_mime_types] that for writing to and reading from the clipboard, these three data types must be supported:

[list_of_representations]: https://www.w3.org/TR/clipboard-apis/#list-of-representations
[mandatory_mime_types]: https://www.w3.org/TR/clipboard-apis/#mandatory-data-types-x

 * `text/plain` represents plain text.
 * `text/html` represents HTML.
 * `image/png` represents PNG images.
 

So when I pasted my content, Google Docs read the `text/html` representation and used that to retain the rich text formatting. VS Code only cares about the raw text and as such read the `text/plain` representation. Makes sense.

Reading a specific representation via async Clipboard API's `read` method is quite straightforward:

```ts
const items = await navigator.clipboard.read();

for (const item of items) {
  if (item.types.includes("text/html")) {
    const blob = await item.getType("text/html");
    const html = await blob.text();
    // Do stuff with HTML...
  }
}
```

Writing multiple representations to the clipboard via `write` is bit more involved, but still relatively straightforward. First, we construct `Blob`s for each format we want to write:

```tsx
const textBlob = new Blob(["Hello, world"], { type: "text/plain" });
const htmlBlob = new Blob(["Hello, <em>world<em>"], { type: "text/html" });
```

Once we have the blobs, we pass them to a new `ClipboardItem` in a key-value store with the data types as the keys and the blobs as the values:

```ts
const clipboardItem = new ClipboardItem({
  [textBlob.type]: textBlob,
  [htmlBlob.type]: htmlBlob,
});
```

<SmallNote>I really like that `ClipboardItem` accepts a key-value store. It nicely aligns with the idea of using a data structure that makes illegal states unrepresentable, as discussed in [Parse, don't validate][parse_dont_validate].</SmallNote>

[parse_dont_validate]: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/#:~:text=Use%20a%20data%20structure%20that%20makes%20illegal%20states%20unrepresentable

Finally, we invoke `write` with our newly constructed `ClipboardItem`:

```ts
await navigator.clipboard.write([clipboardItem]);
```


### What about other data types?

HTML and images are cool, but what about general data interchange formats like JSON? If I were writing an application with copy/paste support, I can imagine wanting to write JSON or some binary data to the clipboard.

Let's try to write JSON data to the clipboard:

```ts
// Create JSON blob
const json = JSON.stringify({ message: "Hello" });
const blob = new Blob([json], { type: "application/json" });

// Write JSON blob to clipboard
const clipboardItem = new ClipboardItem({ [blob.type]: blob });
await navigator.clipboard.write([clipboardItem]);
```

Upon running this, an exception is thrown:

```
Failed to execute 'write' on 'Clipboard':
  Type application/json not supported on write.
```

Hmm, what's up with that? Well, the [spec][write_spec] for `Clipboard.write` tells us that data types other than `text/plain`, `text/html`, and `image/png` must be rejected:

[write_spec]: https://www.w3.org/TR/clipboard-apis/#dom-clipboard-write

> If _type_ is not in the [mandatory data types][mandatory_mime_types] list, then reject [...] and abort these steps.

Interestingly, the `application/json` MIME type was in the mandatory data types list from [2012][spec_2012_mandatory_types] to [2021][spec_2021_mandatory_types] but was removed from the spec in [w3c/clipboard-apis#155][remove_mime_types_not_supported]. Prior to that change, the lists of mandatory data types was much longer, with 16 mandatory data types for reading from the clipboard, and 8 for writing to it. After the change, only `text/plain`, `text/html`, and `image/png` remained.

[spec_2021_mandatory_types]: https://www.w3.org/TR/2021/WD-clipboard-apis-20210806/#mandatory-data-types-x
[spec_2012_mandatory_types]: https://www.w3.org/TR/2012/WD-clipboard-apis-20120223/#mandatory-data-types-1
[remove_mime_types_not_supported]: https://github.com/w3c/clipboard-apis/pull/155

This change was made after browsers opted not to support many of the mandatory types due to [security concerns][webkit_security_concerns]. This is reflected by a warning in the [mandatory data types][mandatory_mime_types] section in the spec:

[webkit_security_concerns]: https://webkit.org/blog/8170/clipboard-api-improvements/#custom-mime-types:~:text=into%20web%20pages.-,Custom%20MIME%20Types,-Because%20the%20system

[raw_clipboard_security_concerns_1]: https://github.com/WICG/raw-clipboard-access/issues/3#issuecomment-521016571
[raw_clipboard_security_concerns_2]: https://github.com/WICG/raw-clipboard-access/blob/f58f5cedc753d55c77994aa05e75d5d2ad7344a7/explainer.md#stakeholder-feedback--opposition

> Warning! The data types that untrusted scripts are allowed to write to the clipboard are limited as a security precaution.
>
> Untrusted scripts can attempt to exploit security vulnerabilities in local software by placing data known to trigger those vulnerabilities on the clipboard.

Okay, so we can only write a limited set of data types to the clipboard. But what's that about _untrusted_ scripts? Can we somehow run code in a "trusted" script which lets us write other data types to the clipboard?


### The isTrusted property

Perhaps the "trusted" part is referring to the [`isTrusted` property on events][istrusted]. `isTrusted` is a read-only property that is only set to true if the event was dispatched by the user agent.

[istrusted]: https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted

```tsx
document.addEventListener("copy", (e: ClipboardEvent) => {
  if (e.isTrusted) {
    // This event was triggered by the user agent
  }
})
```

Being "dispatched by the user agent" means that it was triggered by the user, such as a copy event triggered by the user pressing <Command>Command C</Command>. This is in contrast to a synthetic event programmatically dispatched via `dispatchEvent()`:

```ts
document.addEventListener("copy", (e) => {
  console.log("e.isTrusted is " + e.isTrusted);
});

document.dispatchEvent(new ClipboardEvent("copy"));
//=> "e.isTrusted is false"
```

Let's take a look at clipboard events and see whether they allow us to write other data types to the clipboard.


## The Clipboard Events API

A `ClipboardEvent` is dispatch for copy, cut, and paste events, and it contains a `clipboardData` property of type `DataTransfer`. The `DataTransfer` object is used by the Clipboard Events API to hold multiple representations of data.

Writing to the clipboard in a `copy` event is very straightforward:

```ts
document.addEventListener("copy", (e) => {
  e.preventDefault(); // Prevent default copy behavior

  e.clipboardData.setData("text/plain", "Hello, world");
  e.clipboardData.setData("text/html", "Hello, <em>world</em>");
});
```

And reading from the clipboard in a `paste` event is just as simple:

```ts
document.addEventListener("paste", (e) => {
  e.preventDefault(); // Prevent default paste behavior

  const html = e.clipboardData.getData("text/html");
  if (html) {
    // Do stuff with HTML...
  }
});
```

Now for the big question: can we write JSON to the clipboard?

```ts
document.addEventListener("copy", (e) => {
  e.preventDefault();

  const json = JSON.stringify({ message: "Hello" });
  e.clipboardData.setData("application/json", json); // No error
});
```

No exception is thrown, but did this actually write the JSON to the clipboard? Let's verify that by writing a paste handler that iterates over all of the entries in the clipboard and logs them out:

```ts
document.addEventListener("paste", (e) => {
  for (const item of e.clipboardData.items) {
    const { kind, type } = item;
    if (kind === "string") {
      item.getAsString((content) => {
        console.log({ type, content });
      });
    }
  }
});
```

Adding both of these handlers and invoking copy-paste results in the following being logged:

```json
{ "type": "application/json", content: "{\"message\":\"Hello\"}" }
```

It works! It seems that `clipboardData.setData` does not restrict data types in the same manner as `clipboard.write` does.

But... why? Why can we read and write arbitrary data types using `clipboardData` but not when using the async Clipboard API? Well...


### History of `clipboardData`

The relatively new async Clipboard API was added to the spec in [2017][clipboard_spec_2017], but `clipboardData` is _much_ older than that. A W3C draft for the Clipboard API from [2006][clipboard_spec_2006] defines `clipboardData` and its `setData` and `getData` methods (which shows us that MIME types were not being used at that point):

[clipboard_spec_2017]: https://www.w3.org/TR/2017/WD-clipboard-apis-20170929/
[clipboard_spec_2006]: https://www.w3.org/TR/2006/WD-clipboard-apis-20061115/

> `setData()` This takes one or two parameters. The first must be set to either 'text' or 'URL' (case-insensitive).
>
> `getData()` This takes one parameter, that allows the target to request a specific type of data.

But it turns out that `clipboardData` is even older than the 2006 draft. Look at this quote from the "Status of this Document" section:

> In large part [this document] describes the functionalities as implemented in Internet Explorer...
>
> The intention of this document is [...] to specify what actually works in current browsers, or [be] a simple target for them to improve interoperability, rather than adding new features.

This [2003 article][ie_clipboarddata_exploit] details how, at the time, in Internet Explorer 4 and above, you could use `clipboardData` to read the user's clipboard without their consent. Since Internet Explorer 4 was released in 1997 it seems that the `clipboardData` interface is at least 26 years old at the time of writing.

[ie_clipboarddata_exploit]: https://www.arstdesign.com/articles/clipboardexploit.html

MIME types entered the [spec in 2011][clipboard_spec_2011]:

[clipboard_spec_2011]: https://www.w3.org/TR/2011/WD-clipboard-apis-20110412/

> The _dataType_ argument is a string, for example but not limited to a MIME type...

> If a script calls getData('text/html')...

At the time, the spec had not determined which data types should be used:

> While it is possible to use any string for setData()'s type argument, sticking to common types is recommended.
> 
> [Issue] Should we list some "common types"?

Being able to use _any_ string for `setData` and `getData` still holds today. This works perfectly fine:

```ts
document.addEventListener("copy", (e) => {
  e.preventDefault();
  e.clipboardData.setData("foo bar baz", "Hello, world");
});

document.addEventListener("paste", (e) => {
  const content = e.clipboardData.getData("foo bar baz");
  if (content) {
    console.log(content); // Logs "Hello, world!"
  }
});
```

If you paste this code snippet into your DevTools and then copy and paste, you will see the message "Hello, world" logged to your console.

So, the reasons that the Clipboard Events API (`clipboardData`) allows us to use any data types seems to be a historical one. _"Don't break the web"_.


### Revisiting isTrusted

Let's consider this sentence from the [mandatory data types][mandatory_mime_types] section again:

> The data types that untrusted scripts are allowed to write to the clipboard are limited as a security precaution.

So what happens if we attempt to write to the clipboard in a synthetic (untrusted) clipboard event?

```ts
document.addEventListener("copy", (e) => {
  e.preventDefault();
  e.clipboardData.setData("text/plain", "Hello");
});

document.dispatchEvent(new ClipboardEvent("copy", {
  clipboardData: new DataTransfer(),
}));
```

This runs successfully, but it doesn't modify the clipboard. This is the expected behavior [as explained in the spec](https://www.w3.org/TR/clipboard-apis/#integration-with-other-scripts-and-events):

> Synthetic cut and copy events _must not_ modify data on the system clipboard.

> Synthetic paste events _must not_ give a script access to data on the real system clipboard.

So only copy and paste events dispatched by the user agent are allowed to modify the clipboard. Makes total sense—I wouldn't want websites to freely read my clipboard contents and steal my passwords.

---

To summarize our findings so far:

 * The async Clipboard API introduced in 2017 restricts which data types can be written to and read from the clipboard. However, it can read from and write to the clipboard at any time, given that the user has granted permission to do so (and the [document is focused][has_focus]).
 * The older Clipboard Events API has no real restrictions on which data types can be written to and read from the clipboard. However, it can only be used in copy and paste event handlers triggered by the user agent (when `isTrusted` is true).

[has_focus]: https://www.w3.org/TR/clipboard-apis/#privacy-async

It seems that using the Clipboard Events API is the only way forward if you want to write data to the clipboard that is not just plain text, HTML, or an image. It's much less restrictive in that regard.

But what if you want to build a Copy button that writes non-standard data types to your clipboard? It doesn't seem like you'd be able to use the Clipboard Events API if the user did not trigger a copy event. Right?


## Building a copy button that writes arbitrary data types

I went and tried out Copy buttons in different web applications and inspected what's written to the clipboard. It yielded interesting results.

Google Docs has a Copy button which can be found in their right-click menu.

<Image src="~/google-docs-copy-button.png" plain width={480} />

This copy button writes three representations to the clipboard:

 * `text/plain`,
 * `text/html`, and
 * `application/x-vnd.google-docs-document-slice-clip+wrapped`

<SmallNote>The third representation contains JSON data.</SmallNote>

They're writing a custom data type to the clipboard, which means that they aren't using the async Clipboard API. How are they doing that through a click handler?

I ran the profiler, hit the copy button and inspected the results. Turns out that clicking the copy button triggers a call to `document.execCommand("copy")`.

<Image src="~/google-docs-exec-command.png" plain />

This was surprising to me when I first saw this. My first thought was _"Isn't `execCommand` the old, deprecated way of copying text to the clipboard?"_.

Yes it is, but Google uses it for a reason. `execCommand` is special in that it allows you to programmatically dispatch a trusted copy event as if the user invoked the copy command themselves.

```ts
document.addEventListener("copy", (e) => {
  console.log("e.isTrusted is " + e.isTrusted);
});

document.execCommand("copy");
//=> "e.isTrusted is true"
```

<SmallNote>Safari requires an active selection for `execCommand("copy")` to dispatch a copy event. That selection can be faked by adding an input to the DOM and selecting it prior to invoking `execCommand("copy")`, after which the input can be removed from the DOM.</SmallNote>

Okay, so using `execCommand` allows us to write arbitrary data types to the clipboard in response to click events. Cool!

What about paste? Can we use `execCommand("paste")`?


## Building a paste button

Let's try out Paste button in Google Docs and see what it does.

<Image src="~/google-docs-paste-button.png" plain width={480} />

On my Macbook, I got a popup telling me that I need to install an extension to use the paste button.

<Image src="~/google-docs-paste-popup.png" plain width={650} />

But oddly, on my Windows laptop, the paste button just worked.

Weird. Where does the inconsistency come from? Well, whether or not the paste button will work can be checked by running `queryCommandSupported("paste")`:

```ts
document.queryCommandSupported("paste");
```

On my Macbook, I got `false` on Chrome and Firefox, but `true` on Safari.

Safari, being privacy conscious, required me to confirm the paste action. I think that's a really good idea—it makes it very explicit that the website will read from your clipboard.

<Image src="~/google-docs-paste-confirm.png" plain width={650} />

On my Windows laptop, I got `true` on Chrome and Edge, but `false` on Firefox. The inconsistency with Chrome is surprising. Why does Chrome allow `execCommand("paste")` on Windows but not macOS? I wasn't able to find any info on this.

It's also surpising to me that they don't attempt to fall back to the async Clipboard API when `execCommand("paste")` is unavailable. Even though they wouldn't be able to read the `application/x-vnd.google-[...]` representation using it, the HTML representation contains internal IDs that could be used.

```html
<!-- HTML representation, cleaned up -->
<meta charset="utf-8">
<b id="docs-internal-guid-[guid]" style="...">
  <span style="...">Copied text</span>
</b>
```

---

Another web application with a paste button is Figma, and they take a completely different approach. Let's see what they're doing.


## Copy and Paste in Figma

Figma is a web-based application (their native app uses [Electron][electron]). Let's see what their copy button writes to the clipboard.

[electron]: https://www.electronjs.org/

<Image src="~/figma-copy-button.png" plain width={480} />

Figma's copy button writes two representations to the clipboard: `text/plain` and `text/html`. This was surprising to me at first. How would Figma represent their various layout and styling features in plain HTML?

But looking at the HTML, we see two empty `span` elements with `data-metadata` and `data-buffer` properties:

```html
<meta charset="utf-8">
<div>
  <span data-metadata="<!--(figmeta)eyJma[...]9ifQo=(/figmeta)-->"></span>
  <span data-buffer="<!--(figma)ZmlnL[...]P/Ag==(/figma)-->"></span>
</div>
<span style="white-space:pre-wrap;">Text</span>
```

<SmallNote>The `data-buffer` string is ~26,000 characters for an empty frame. After that, the length of `data-buffer` seems to grow linearly with the amount of content that's copied.</SmallNote>

Looks like base64. The `eyJ` start is a clear indication of `data-metadata` being a base64 encoded JSON string. Running `JSON.parse(atob())` on `data-metadata` yields:

```json
{
  "fileKey": "4XvKUK38NtRPZASgUJiZ87",
  "pasteID": 1261442360,
  "dataType": "scene"
}
```

<SmallNote>I've replaced the real `fileKey` and `pasteID`.</SmallNote>

But what about the big `data-buffer` property? Base64 decoding it yields the following:

```
fig-kiwiF\x00\x00\x00\x1CK\x00\x00µ½\v\x9CdI[...]\x197Ü\x83\x03
```

Looks like a binary format. After a bit of digging—using `fig-kiwi` as a clue—I found out that this is the [Kiwi message format][kiwi] (created by Figma's co-founder and former CTO [Evan Wallace][evanw]), which is used to encode `.fig` files.

Since Kiwi is a schema-based format, it seemed like we wouldn't be able to parse this data without knowing the schema. However, lucky for us, Evan created a [public `.fig` file parser][fig_file_parser]. Let's try plugging the buffer into that!

[kiwi]: https://github.com/evanw/kiwi
[evanw]: https://github.com/evanw
[fig_file_parser]: https://github.com/evanw/kiwi/issues/17#issuecomment-1937797254

To convert the buffer into a `.fig` file, I wrote a small script to generate a Blob URL:

```ts
const base64 = "ZmlnL[...]P/Ag==";
const blob = base64toBlob(base64, "application/octet-stream");

console.log(URL.createObjectURL(blob));
//=> blob:<origin>/1fdf7c0a-5b56-4cb5-b7c0-fb665122b2ab
```

I then downloaded the resulting blob as a `.fig` file, uploaded that to the `.fig` file parser, and voilà:

<Image src="~/figma-data.png" plain width={620} />

So copying in Figma works by creating a small Figma file, encoding that as a base64, placing the resulting base64 string into the `data-buffer` attribute of an empty HTML `span` element, and storing that in the user's clipboard.


## The benefits of copy/pasting HTML

This seemed a bit silly to me at first, but there is a strong benefit to taking that approach. To understand why, consider how the web-based Clipboard API interacts with the various operating system Clipboard APIs.

Windows, macOS and Linux all offer different formats for writing data to the clipboard. If you want to write HTML to the clipboard, [Windows has `CF_HTML`][win_html_clipboard] and [macOS has `NSPasteboard.PasteboardType.html`][macos_html_clipboard] (the answer for Linux seems less straightforward, so I won't cover it).

[win_html_clipboard]: https://learn.microsoft.com/en-us/windows/win32/dataxchg/html-clipboard-format
[macos_html_clipboard]: https://developer.apple.com/documentation/appkit/nspasteboard/pasteboardtype/1529057-html

All of the operating systems offer types for the lowest common demoninator formats (plain text, HTML, and PNG images). But which OS format should the browser use when the user attempts to write an arbitrary data type like `application/foo-bar` to the clipboard?

There isn't a good match, so the browser doesn't write that representation to the OS clipboard. Instead, that representation only exists within the browser. This results in being able to copy and paste arbitrary data types across browser tabs, but _not_ across applications.

This is why using the common data types, `text/plain`, `text/html`, and `image/png`, is so convenient. They are mapped to OS-specific formats and as such are written to the native OS clipboard, which makes copy/paste work across applications. In Figma's case, using `text/html` enables copying a Figma element from `figma.com` in the browser and then pasting it into the native Figma app, and vice versa.

<ClipboardTest/>

