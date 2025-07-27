import { cssVariables } from "../utils/cssVariables";
import { StyleOptions } from "../utils/styles";

export const AsciiRendererStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: space-between;
    pointer-events: none;
  `,

  row: styled.css`
    display: flex;
    justify-content: space-between;
  `,

  char: styled.css`
    font-family: ${cssVariables.fontMonospace};
  `,
});
