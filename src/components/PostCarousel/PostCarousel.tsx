import React, { useEffect, useRef, useState } from "react";
import { useStyles } from "../../utils/styles";
import {
  postCarouselItemGap,
  postCarouselItemWidth,
  PostCarouselStyles,
} from "./PostCarousel.styles";

interface Props {
  children: React.ReactNode;
}

export const PostCarousel = (props: Props) => {
  const s = useStyles(PostCarouselStyles);
  const scrollRef = useRef<HTMLElement>(null);

  const [index, setIndex] = useState(0);
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    const listener = () => {
      if (window.innerWidth <= 900 && indexRef.current != 0) {
        setIndex(0);
      }
    };
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);

  return (
    <section className={s("container")} ref={scrollRef}>
      <div
        className={s("inner")}
        style={{
          transform: `translateX(${(postCarouselItemWidth + postCarouselItemGap) * -index}px)`,
        }}
      >
        {React.Children.map(props.children, (child, i) => {
          const indexRelative = i - index;
          const outOfBounds = indexRelative < 0 || indexRelative > 1;
          const onClick = !outOfBounds
            ? undefined
            : () => setIndex((index) => (indexRelative < 0 ? index - 1 : index + 1));
          return (
            <div className={s("item", { outOfBounds })} key={i} onClick={onClick}>
              {child}
            </div>
          );
        })}
      </div>
    </section>
  );
};
