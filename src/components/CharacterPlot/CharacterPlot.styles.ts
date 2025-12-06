import { cssVariables, colors } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";

export const CharacterPlotStyles = ({ styled }: StyleOptions) => ({
  container: styled.css`
    position: relative;
    max-width: 100%;
    width: 540px;
    margin: 40px auto;
    background: ${colors.background};
  `,

  plot: styled.css`
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
    touch-action: none;
  `,

  grid: styled.css`
    pointer-events: none;
  `,

  gridLine: styled.css`
    stroke: ${colors.medium400};
    stroke-width: 0.0014;
    opacity: 0.9;
  `,

  plotBorder: styled.css`
    fill: none;
    stroke: ${colors.medium400};
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

  axisTitle: styled.css`
    fill: ${colors.text700};
    font-family: ${cssVariables.fontFamily};
    font-weight: 500;
    text-anchor: middle;
  `,

  points: styled.css`
    /* Points group styles */
  `,

  point: styled.css`
    fill: ${colors.text700};
    transition: r 0.2s ease, fill 0.2s ease;
  `,

  pointHovered: styled.css`
    fill: ${colors.text};
  `,

  characterLabelBackground: styled.css`
    fill: ${colors.background};
    pointer-events: none;
  `,

  characterLabel: styled.css`
    fill: ${colors.text};
    font-family: ${cssVariables.fontMonospace};
    font-weight: 600;
    pointer-events: none;
  `,

  hoverLine: styled.css`
    stroke: ${colors.blue};
    stroke-width: 0.002;
    pointer-events: none;
  `,

  inputLine: styled.css`
    stroke: ${colors.blue};
    stroke-width: 0.003;
    pointer-events: none;
  `,

  inputPoint: styled.css`
    fill: ${colors.blue};
    pointer-events: none;
  `,

  inputLabel: styled.css`
    fill: ${colors.blue};
    font-family: ${cssVariables.fontMonospace};
    font-weight: 600;
    pointer-events: none;
  `,
});
