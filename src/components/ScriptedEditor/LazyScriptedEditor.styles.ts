import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions } from "../../utils/styles";
import { scriptedEditorConstants } from "./scriptedEditorConstants";

const { LINE_HEIGHT, V_PADDING, SCRIPTED_EDITOR_MIN_WIDTH } = scriptedEditorConstants;

export const LazyScriptedEditorStyles = ({ styled, theme }: StyleOptions) => ({
  outerWrapper: styled.css`
    position: relative;
  `,

  editorWrapper: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  `,

  lineWrapper: styled.css`
    padding: ${V_PADDING}px 0;
    overflow: hidden;

    @media (max-width: ${SCRIPTED_EDITOR_MIN_WIDTH}px) {
      padding: 3.75vw 0; // 24px / 640px
    }
  `,

  line: styled.css`
    height: ${LINE_HEIGHT}px;

    @media (max-width: ${SCRIPTED_EDITOR_MIN_WIDTH}px) {
      height: 4.21875vw; // 27px / 640px
    }
  `,

  placeholder: styled.css`
    position: absolute;
    top: 0;
    left: -24px;
    right: -24px;
    bottom: 0;
    background: ${theme.background300};
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-family: ${cssVariables.fontMonospace};
    color: ${theme.text400};
    border-radius: 8px;
  `,
});
