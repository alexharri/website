import Highlight, { defaultProps } from "prism-react-renderer";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsomorphicLayoutEffect } from "../../utils/hooks/useIsomorphicLayoutEffect";
import { useStyles } from "../../utils/styles";
import { prismTheme } from "./prismTheme";
import { TypeAnnotationStyles } from "./TypeAnnotation.styles";

interface Props {
  type: string;
  children: React.ReactNode;
}

export const TypeAnnotation: React.FC<Props> = (props) => {
  const s = useStyles(TypeAnnotationStyles);
  const [hover, _setHover] = useState(false);

  const timeoutRef = useRef<number>();
  const setHover = useCallback((hover: boolean) => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => _setHover(hover), 150);
  }, []);

  const tokenRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!hover) return;

    const rect = tokenRef.current?.getBoundingClientRect();
    const popup = popupRef.current;

    if (!popup || !rect) return;

    popup.style.top = rect.top + rect.height + "px";
    popup.style.left = rect.left + "px";
  }, [hover]);

  const hoverProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  return (
    <>
      <span {...hoverProps} ref={tokenRef} data-type={props.type}>
        {props.children}
      </span>
      {hover &&
        createPortal(
          <div ref={popupRef} className={s("popup")} {...hoverProps}>
            <Highlight {...defaultProps} code={props.type} language="typescript" theme={prismTheme}>
              {({ className, style, tokens: lines, getLineProps, getTokenProps }) => (
                <pre className={[className, s("pre")].join(" ")} style={{ ...style, fontSize: 16 }}>
                  {lines.map((line, i) => {
                    return (
                      <div {...getLineProps({ line, key: i })}>
                        {line.map((token, i) => (
                          <span {...getTokenProps({ token, i })} key={i} />
                        ))}
                      </div>
                    );
                  })}
                </pre>
              )}
            </Highlight>
          </div>,
          document.body,
        )}
    </>
  );
};
