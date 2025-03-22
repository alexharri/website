import React, { useMemo } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";

interface Props {
  query: string;
  children: React.ReactNode;
}

export const MediaQuery = (props: Props) => {
  const stylesheet = useMemo(() => {
    return ({ styled }: StyleOptions) => ({
      wrapper: styled.css`
        display: none;
        @media ${props.query} {
          display: initial;
        }
      `,
    });
  }, [props.query]);

  const s = useStyles(stylesheet);

  return <span className={s("wrapper")}>{props.children}</span>;
};
