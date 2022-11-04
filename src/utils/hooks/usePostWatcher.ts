import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { useEffect, useRef, useState } from "react";

interface Options {
  version: string;
  source: MDXRemoteSerializeResult;
  slug: string;
}

export function usePostWatcher(options: Options) {
  const { slug } = options;

  const [source, setSource] = useState(options.source);
  const [version, setVersion] = useState(options.version);

  const versionRef = useRef(version);
  versionRef.current = version;

  useEffect(() => {
    let unmounted = false;

    function pollAfterDelay() {
      if (process.env.NODE_ENV === "production") return;

      if (unmounted) return;
      setTimeout(poll, 1000);
    }

    async function poll() {
      try {
        const versionData = await fetch(`/api/blog/${slug}/version`).then(
          (res) => res.json()
        );

        if (versionData.version === versionRef.current) {
          pollAfterDelay();
          return;
        }

        const sourceData = await fetch(`/api/blog/${slug}/post`).then((res) =>
          res.json()
        );

        if (unmounted) return;

        console.log("Fetched post");

        setSource(sourceData.source);
        setVersion(versionData.version);

        pollAfterDelay();
      } catch (e) {
        console.log(e);
        pollAfterDelay();
      }
    }

    pollAfterDelay();

    return () => {
      unmounted = true;
    };
  }, []);

  return source;
}
