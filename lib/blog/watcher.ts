import path from "path";
import fs from "fs/promises";
import { Server } from "socket.io";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { MdxOptions } from "@alexharri/blog/types";

async function startWatcher(onUpdated: (slug: string) => void) {
  const watcher = fs.watch(process.cwd(), { recursive: true });
  for await (const event of watcher) {
    const { filename } = event;
    if (/\.mdx?$/.test(filename)) onUpdated(filename);
  }
}

export function startWatcherServer(mdxOptions?: MdxOptions) {
  const io = new Server();
  const PATH_KEY = "__path";

  io.on("connection", (socket) => {
    // When a new connection is established, we expect the client to let us know which post
    // they're listening to updates for. They do that by sending the path to the post
    // (relative to 'process.cwd()').
    socket.on("path", (slug: unknown) => {
      if (typeof slug !== "string") {
        console.error(`Expected 'path' to be a string. Got '${slug}'`);
        return;
      }
      (socket as any)[PATH_KEY] = slug;
    });
  });

  async function getSource(fileName: string) {
    const filePath = path.resolve(process.cwd(), fileName);
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { content, data } = matter(fileContent);
    if (typeof mdxOptions === "function") mdxOptions = await mdxOptions();
    const source = await serialize(content, { scope: data, mdxOptions });
    return source;
  }

  startWatcher(async (fileName: string) => {
    const filePathRelative = fileName.split(".")[0];
    const source = await getSource(fileName);
    let nSent = 0;
    for (const socket of io.sockets.sockets.values()) {
      if ((socket as any)[PATH_KEY] === filePathRelative) {
        socket.emit("post", source);
        nSent++;
      }
    }
    console.log(
      `Sent updated content for '${fileName}' to ${nSent} ${nSent === 1 ? "tab" : "tabs"}.`,
    );
  });

  io.listen(3000);
}
