import { currentTime } from "./time";
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
    let delaySeconds = 1;
    let unmounted = false;

    function pollAfterDelay() {
      if (process.env.NODE_ENV === "production") return;

      if (unmounted) return;
      setTimeout(poll, delaySeconds * 1000);
    }

    async function poll() {
      try {
        const versionData = await fetch(`/api/__postwatcher?return=version&slug=${slug}`).then(
          (res) => res.json(),
        );

        if (versionData.version === versionRef.current) {
          pollAfterDelay();
          return;
        }

        const res = await fetch(`/api/__postwatcher?return=post&slug=${slug}`);

        if (res.status < 200 || res.status > 299) {
          console.error(`[${currentTime()}] Refreshing post failed with status ${res.status}`);
          pollAfterDelay();
          return;
        }

        const postData = await res.json();

        delaySeconds = 1; // Reset delay after a successful fetch

        if (unmounted) return;

        console.log(`[${currentTime()}] Refreshed post content`);

        setSource(postData.source);
        setVersion(versionData.version);

        pollAfterDelay();
      } catch (e) {
        // Progressively make the delay longer, up to a maximum of 8 seconds
        if (delaySeconds < 8) delaySeconds *= 2;
        console.warn(`[${currentTime()}] Failed to refresh post. Is your dev server running?`);
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
