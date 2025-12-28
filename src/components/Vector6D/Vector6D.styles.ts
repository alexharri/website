import { cssVariables, colors } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export default ({ styled }: StyleOptions) => ({
  containerOuter: styled.css`
    margin: 30px auto;
    max-width: 100%;
    width: 180px;

    &--hasExternal {
      width: 310px;

      @media (max-width: 700px) {
        width: 270px;
      }
    }
  `,

  container: styled.css`
    position: relative;
    width: 100%;
    height: 0;
  `,

  circle: styled.css`
    border: 1px solid ${colors.text400};
    border-radius: 50%;
    padding-bottom: 100%;

    &--external {
      border-style: dashed;
    }
  `,

  circleText: styled.css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 16px;
    color: ${colors.text};
    font-family: ${cssVariables.fontMonospace};
    font-weight: 500;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);

    @media (max-width: 500px) {
      font-size: 14px;
    }
  `,
});
