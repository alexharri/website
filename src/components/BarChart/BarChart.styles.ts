import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const BarChartStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    max-width: calc(100% + ${cssVariables.contentPadding * 2}px);
    overflow-x: auto;
    margin: 0 -${cssVariables.contentPadding}px;
  `,

  inner: styled.css`
    height: 400px;
    padding: 0 ${cssVariables.contentPadding}px;
    width: ${cssVariables.contentWidth + cssVariables.contentPadding * 2}px;
    margin: 0 auto;
  `,
});
