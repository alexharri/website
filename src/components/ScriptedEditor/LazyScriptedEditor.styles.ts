import { StyleOptions } from "../../utils/styles";
import { scriptedEditorConstants } from "./scriptedEditorConstants";

const { LINE_HEIGHT, V_PADDING, SCRIPTED_EDITOR_MIN_WIDTH } = scriptedEditorConstants;

export const LazyScriptedEditorStyles = ({ styled }: StyleOptions) => ({
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
    top: 16px;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-background-300);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    font-family: var(--font-monospace);
    color: var(--color-text-600);
    border-radius: 8px;
  `,
});
