import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const BarChartStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    max-width: calc(100% + ${cssVariables.contentPadding * 2}px);
    overflow-x: auto;
    margin: 0 -${cssVariables.contentPadding}px;
  `,

  wrapper: styled.css`
    padding: 0 ${cssVariables.contentPadding}px;
    margin: 0 auto;
  `,

  inner: styled.css``,

  controls: styled.css`
    display: flex;
    justify-content: center;
  `,
});
