import React, { useContext, useEffect, useMemo, useState } from "react";

export type OperatingSystem = "windows" | "macos" | "linux";

interface IOperatingSystemContext {
  os: OperatingSystem;
  isMac: boolean;
  setOs: (os: OperatingSystem) => void;
}

export const OperatingSystemContext = React.createContext<IOperatingSystemContext>({
  isMac: true,
  os: "macos",
  setOs: () => {},
});

interface Props {
  children: React.ReactNode;
}

export const OperatingSystemProvider = (props: Props) => {
  const [os, setOs] = useState<OperatingSystem>("macos");

  const value = useMemo(() => ({ os, isMac: os === "macos", setOs }), [os]);

  useEffect(() => {
    const platform = navigator.platform.toLowerCase();
    if (platform.startsWith("mac") || platform.startsWith("iphone")) {
      return setOs("macos");
    }
    if (platform.includes("linux") || platform.includes("android")) {
      return setOs("linux");
    }
    setOs("windows");
  }, []);

  return (
    <OperatingSystemContext.Provider value={value}>
      {props.children}
    </OperatingSystemContext.Provider>
  );
};

export const NotMacOs = (props: Props) => {
  const { os } = useContext(OperatingSystemContext);
  if (os === "macos") return null;
  return props.children;
};
