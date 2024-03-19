import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions, useStyles } from "../../utils/styles";

const styles = ({ styled, theme }: StyleOptions) => ({
  wrapper: styled.css`
    margin: 0 auto;
    width: 100%;
    max-width: ${cssVariables.contentWidth}px;
  `,

  container: styled.css`
    background: ${theme.background300};
    border-radius: 8px;
    padding: 24px ${cssVariables.contentPadding + 16}px 16px;
    margin: 0 -16px 0;
  `,
});

interface Props {
  title?: string;
  heading?: "h1" | "h2" | "h3";
  children: React.ReactNode;
}

export const Section: React.FC<Props> = (props) => {
  const s = useStyles(styles);
  const Heading = props.heading || "h2";
  return (
    <div className={s("wrapper")}>
      <div className={s("container")}>
        {props.title && <Heading style={{ marginTop: 0 }}>{props.title}</Heading>}
        {props.children}
      </div>
    </div>
  );
};
