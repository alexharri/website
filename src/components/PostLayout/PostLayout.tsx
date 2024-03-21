import { cssVariables } from "../../utils/cssVariables";
import { StyleOptions, useStyles } from "../../utils/styles";

const Styles = ({ styled }: StyleOptions) => ({
  main: styled.css`
    padding: 0 ${cssVariables.contentPadding}px;

    & > p,
    & > h1,
    & > h2,
    & > h3,
    & > h4,
    & > h5,
    & > h6,
    & > ul,
    & > ol,
    & > hr,
    & > blockquote,
    & > table,
    & > iframe,
    & > .pre,
    & > .flow {
      width: 100%;
      max-width: ${cssVariables.contentWidth - cssVariables.contentPadding * 2}px;
      margin-left: auto;
      margin-right: auto;
    }

    & > iframe {
      display: block;
      margin-top: 40px;
      margin-bottom: 40px;
    }

    & > .pre,
    & > .image,
    & > table {
      & + .note,
      & + [data-script-id] + .note {
        margin-top: -24px;
        margin-bottom: 40px;
      }
    }

    & > .scene {
      margin: 24px 0;

      & + .note {
        margin-top: -24px;
        margin-bottom: 40px;
        position: relative;
        z-index: 1;
      }
    }

    .scene {
    }

    & > .pre {
      margin-top: 40px;
      margin-bottom: 40px;

      @media (max-width: 800px) {
        max-width: initial;
      }
    }
  `,
});

interface Props {
  children: React.ReactNode;
}

export const PostLayout: React.FC<Props> = (props) => {
  const s = useStyles(Styles);

  return <main className={s("main")}>{props.children}</main>;
};
