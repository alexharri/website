import { useEffect, useRef } from "react";
import { lerp } from "../../math/lerp";
import { StyleOptions, useStyles } from "../../utils/styles";
import { useVisible } from "../../utils/hooks/useVisible";

const SHADE_W = 1000;

const styles = ({ styled }: StyleOptions) => ({
  scene: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    @media (max-width: 800px) {
      width: 100%;
      border-radius: 0;
    }

    p {
      position: relative;
      z-index: 3;
      padding: 0 32px;
      text-align: center;
    }
  `,

  shadeContainer: styled.css`
    opacity: 0;
    transition: opacity 2.5s;
  `,

  shade1: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${SHADE_W}px;
    z-index: 1;
    background: linear-gradient(
      90deg,
      hsl(216deg 36% 5%) 0%,
      hsl(215deg 36% 10%) 9%,
      hsl(213deg 46% 15%) 18%,
      hsl(212deg 53% 19%) 27%,
      hsl(204deg 84% 18%) 36%,
      hsl(196deg 100% 15%) 45%,
      hsl(187deg 100% 12%) 55%,
      hsl(174deg 100% 10%) 64%,
      hsl(179deg 100% 8%) 73%,
      hsl(190deg 83% 8%) 82%,
      hsl(200deg 50% 8%) 91%,
      hsl(216deg 36% 5%) 100%
    );
    opacity: 0.4;
    transform: skew(-15deg, 0);
  `,

  shade2: styled.css`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: ${SHADE_W}px;
    z-index: 1;
    background: linear-gradient(
      90deg,
      hsl(216deg 36% 5%) 0%,
      hsl(261deg 24% 11%) 9%,
      hsl(322deg 37% 15%) 18%,
      hsl(351deg 49% 20%) 27%,
      hsl(6deg 56% 21%) 36%,
      hsl(351deg 61% 19%) 45%,
      hsl(337deg 76% 15%) 55%,
      hsl(325deg 86% 11%) 64%,
      hsl(304deg 64% 9%) 73%,
      hsl(271deg 45% 9%) 82%,
      hsl(239deg 35% 8%) 91%,
      hsl(216deg 36% 5%) 100%
    );
    opacity: 0.4;
    transform: skew(-15deg, 0);
  `,
});

interface Props {
  children: React.ReactNode;
}

export const SkeletonLoaderAnimation = (props: Props) => {
  const s = useStyles(styles);

  const containerRef = useRef<HTMLDivElement>(null);
  const shadeContainerRef = useRef<HTMLDivElement>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);

  const startRef = useRef(0);
  const visible = useVisible(containerRef, "100px");

  useEffect(() => {
    const shade1 = ref1.current;
    const shade2 = ref2.current;
    const container = containerRef.current;
    const shadeContainer = shadeContainerRef.current;

    if (!shade1 || !shade2 || !shadeContainer || !container) return;
    shadeContainer.style.opacity = String(visible ? 1 : 0);

    if (!visible) return;
    startRef.current = Date.now() - 700;

    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      requestAnimationFrame(tick);

      const elapsed = Date.now() - startRef.current;
      const t1 = cycler(4000, 3000, elapsed);
      const t2 = cycler(4000, 3000, elapsed + 2300);

      const contWidth = container.clientWidth;
      shade1.style.transform = `translateX(${lerp(-(SHADE_W + 100), contWidth + 100, t1)}px)`;
      shade2.style.transform = `translateX(${lerp(-(SHADE_W + 100), contWidth + 100, t2)}px)`;
    };
    tick();
    return () => {
      mounted = false;
    };
  }, [visible]);

  return (
    <div className={s("scene")} ref={containerRef}>
      <div className={s("shadeContainer")} ref={shadeContainerRef}>
        <div className={s("shade1")} ref={ref1} />
        <div className={s("shade2")} ref={ref2} />
      </div>
      {props.children}
    </div>
  );
};

function cycler(cycle: number, duration: number, elapsed: number) {
  return Math.max(0, ((elapsed % cycle) - (cycle - duration)) / duration);
}
