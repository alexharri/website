import { StyleOptions } from "../../utils/styles";

export const TypeAnnotationStyles = ({ styled, theme }: StyleOptions) => ({
  popup: styled.css`
    position: fixed;
    z-index: 100;
    background: ${theme.background300};
    border: 1px solid ${theme.background100};
    color: white;
    padding: 4px 16px;
    border-radius: 4px;
    top: -9999px;
    left: -9999px;
  `,

  pre: styled.css`
    margin: 0;
  `,
});
