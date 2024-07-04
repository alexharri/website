import { useStyles } from "../../utils/styles";
import styles from "./Toggle.styles";

interface Props {
  checked: boolean;
  onValueChange: (value: boolean) => void;
  children: React.ReactNode;
}

export const Toggle: React.FC<Props> = (props) => {
  const { checked, onValueChange } = props;

  const s = useStyles(styles);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== " " && e.key !== "Enter") {
      return;
    }
    e.preventDefault();
    onValueChange(!props.checked);
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(!props.checked);
  };

  return (
    <div
      role="checkbox"
      className={s("toggle")}
      onKeyDown={onKeyDown}
      onClick={onClick}
      tabIndex={0}
      aria-checked={checked}
    >
      <div className={s("pill", { checked })}>
        <div className={s("circle", { checked })} />
      </div>
      <div className={s("label", { checked })}>{props.children}</div>
    </div>
  );
};
