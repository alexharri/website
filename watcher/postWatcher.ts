import fs from "fs";
import path from "path";
import fsPromises from "fs/promises";
import { POSTS_PATH } from "@alexharri/blog/src/md";

console.log("Started watcher");

async function watch() {
  const watcher = fsPromises.watch(POSTS_PATH, { recursive: true });

  for await (const event of watcher) {
    const { filename } = event;

    if (!/\.mdx?$/.test(filename)) {
      continue;
    }

    const slug = filename.split(".")[0];

    const idFileName = path.resolve(POSTS_PATH, "./.version", slug);
    const versionExists = fs.existsSync(idFileName);

    let version: number;

    if (versionExists) {
      version = Number(fs.readFileSync(idFileName, "utf-8"));
      if (!Number.isFinite(version)) {
        version = 0;
      }
    } else {
      version = 0;
    }

    fs.writeFileSync(idFileName, String(version + 1), "utf-8");
  }
}

watch();
