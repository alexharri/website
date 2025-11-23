import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  outerWrapper: styled.css`
    margin: 32px 0 40px;
  `,

  wrapper: styled.css`
    display: flex;
    gap: 16px;
    justify-content: center;
    align-items: center;
  `,

  arrow: styled.css`
    text-align: center;
    font-size: 80px;
    font-family: ${cssVariables.fontMonospace};
    color: ${theme.text};
    padding-left: 40px;
  `,

  vector: styled.css`
    width: 200px;
  `,

  characterPick: styled.css`
    width: 180px;
    text-align: center;
    font-size: 200px;
    font-family: ${cssVariables.fontMonospace};
    color: ${theme.text};
  `,

  variables: styled.css`
    margin: 0 auto;
    display: flex;
    justify-content: center;
  `,
});
