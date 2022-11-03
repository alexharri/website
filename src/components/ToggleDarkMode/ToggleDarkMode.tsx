import { useColorMode } from "../../utils/colorMode";
import { MoonIcon24 } from "../Icon/MoonIcon24";
import { SunIcon24 } from "../Icon/SunIcon24";
import styles from "./ToggleDarkMode.module.scss";

export const ToggleDarkMode = () => {
  const [colorMode, setColorMode] = useColorMode();

  let Icon: React.ComponentType | null = null;

  if (colorMode) {
    Icon = colorMode === "light" ? SunIcon24 : MoonIcon24;
  }

  return (
    <button
      onClick={() => setColorMode(colorMode === "light" ? "dark" : "light")}
      className={styles.button}
    >
      {Icon && <Icon />}
    </button>
  );
};
