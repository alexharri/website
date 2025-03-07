import { StyleOptions, useStyles } from "../../utils/styles";

const ThreeDotsStyles = ({ styled, theme }: StyleOptions) => ({
  hr: styled.css`
    position: relative;
    display: flex;
    gap: 24px;
    justify-content: center;
    margin: 48px 0 56px;

    hr {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      height: 0;
      width: 0;
      display: none;
    }

    span {
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: ${theme.medium500};
    }
  `,
});

export const ThreeDots = () => {
  const s = useStyles(ThreeDotsStyles);
  return (
    <div className={s("hr")}>
      <hr />
      <span />
      <span />
      <span />
    </div>
  );
};
