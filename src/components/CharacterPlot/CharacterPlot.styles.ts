import { cssVariables, colors } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const CharacterPlotStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    position: relative;
    max-width: 100%;
    width: 600px;
    margin: 40px auto;
    background: ${colors.background};
  `,

  plot: styled.css`
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  `,

  grid: styled.css`
    pointer-events: none;
  `,

  gridLine: styled.css`
    stroke: ${colors.medium400};
    stroke-width: 0.001;
    opacity: 0.5;
  `,

  plotBorder: styled.css`
    fill: none;
    stroke: ${colors.medium700};
    stroke-width: 0.002;
  `,

  axisLabels: styled.css`
    pointer-events: none;
  `,

  axisLabel: styled.css`
    fill: ${colors.text400};
    font-family: ${cssVariables.fontFamily};
    text-anchor: middle;
  `,

  characters: styled.css`
    /* Character group styles */
  `,

  character: styled.css`
    fill: ${colors.text};
    font-family: ${cssVariables.fontMonospace};
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  `,

  characterHovered: styled.css`
    fill: ${colors.blue400};
    font-weight: 600;
  `,
});
