import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export default ({ styled, theme }: StyleOptions) => ({
  outerWrapper: styled.css`
    margin: 32px auto 40px;
    width: 600px;
    max-width: 100%;
    display: flex;
    flex-direction: column;

    @media (max-width: 600px) {
      width: 290px;
    }

    &--external {
      width: 600px;

      @media (max-width: 600px) {
        width: 290px;
      }
    }
  `,

  wrapper: styled.css`
    display: flex;
    gap: 40px;
    justify-content: center;
    align-items: center;

    @media (max-width: 600px) {
      gap: 0;
      flex-direction: column;
      border: 1px solid ${theme.medium500};
      background: ${theme.background100};
      border-radius: 16px;
    }
  `,

  vector: styled.css`
    @media (max-width: 600px) {
      width: 100%;
      padding: 0 24px 0;
    }
  `,

  arrow: styled.css`
    text-align: center;
    font-size: 80px;
    font-family: ${cssVariables.fontMonospace};
    color: ${theme.text};

    @media (max-width: 600px) {
      display: none;
    }
  `,

  character: styled.css`
    text-align: center;
    font-size: 130px;
    font-family: ${cssVariables.fontMonospace};
    color: ${theme.text};
    padding: 0 0.2em;
    border: 1px solid ${theme.medium500};
    background: ${theme.background300};
    border-radius: 8px;
    line-height: 1.2;

    @media (max-width: 700px) {
      font-size: 110px;
    }

    @media (max-width: 600px) {
      display: none;
    }
  `,

  banner: styled.css`
    font-size: 16px;
    color: ${theme.text700};
    background: ${theme.background300};
    display: flex;
    justify-content: center;
    align-self: stretch;
    align-items: center;
    gap: 12px;
    padding: 8px 24px;

    &--top {
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      border-bottom: 1px solid ${theme.medium500};
      padding: 16px 24px;
    }
    &--bottom {
      border-top: 1px solid ${theme.medium500};
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
    }

    strong {
      color: ${theme.text};
      font-family: ${cssVariables.fontMonospace};
      font-size: 40px;
      width: 1.2em;
      border: 1px solid ${theme.medium500};
      background: ${theme.background};
      border-radius: 6px;
      line-height: 1.2em;
      text-align: center;
    }

    @media (min-width: 601px) {
      display: none;
    }
  `,

  variables: styled.css`
    margin: 40px auto 0;
    display: flex;
    justify-content: center;

    @media (max-width: 600px) {
      display: none;
    }
  `,
});
