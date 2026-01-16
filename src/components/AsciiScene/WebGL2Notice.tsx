import { useEffect, useState } from "react";
import { Note } from "../Note/Note";

function checkWebGL2Support(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    return gl != null;
  } catch (e) {
    return false;
  }
}

export function WebGL2Notice() {
  const [isWebGL2Supported, setIsWebGL2Supported] = useState<boolean>(true);

  useEffect(() => {
    setIsWebGL2Supported(checkWebGL2Support());
  }, []);

  if (isWebGL2Supported) {
    return null;
  }

  return (
    <Note variant="warning">
      <p style={{ fontSize: 20 }}>
        <strong>WebGL 2 is not supported in your browser or has been disabled.</strong>
      </p>
      <p>
        Many of the demos in this post require WebGL 2 to run smoothly on the GPU. A CPU fallback
        renderer will be used, but performance will be degraded.
      </p>
      <p>
        Try enabling WebGL 2 in your browser settings. If WebGL 2 is not supported by your browser,
        consider reading this post in a modern browser.
      </p>
    </Note>
  );
}
