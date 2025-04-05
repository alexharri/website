import dynamic from "next/dynamic";
import type { WebGLShaderProps } from "./WebGLShader";
import { WebGLShaderSkeleton, WebGLShaderPropsContext } from "./WebGLShaderSkeleton";
import { useRef, useState } from "react";
import { ColorConfiguration, colorConfigurations } from "./colorConfigurations";
import { useVisible } from "../../utils/hooks/useVisible";
import { StyleOptions, useStyles } from "../../utils/styles";
import { cssVariables } from "../../utils/cssVariables";
import { SKEW_DEG } from "./utils";

const WebGLShader = dynamic(() => import("./WebGLShader").then((module) => module.WebGLShader), {
  loading: WebGLShaderSkeleton,
});

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    width: 100vw;
    margin: 40px -${cssVariables.contentPadding}px;
    display: flex;
    flex-direction: column;
    align-items: center;

    canvas {
      border-radius: 0;
    }

    &--skew {
      margin: calc(32px + min(100vw, ${cssVariables.contentWidth}px) * 0.04) -${cssVariables.contentPadding}px
        calc(48px + min(100vw, ${cssVariables.contentWidth}px) * 0.04);
    }
  `,

  colorButtonWrapper: styled.css`
    margin-top: 40px;
    padding: 0 ${cssVariables.contentPadding}px;
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    justify-content: center;

    &--skew {
      transform: skewY(-6deg);
    }

    @media (max-width: 600px) {
      margin-top: 32px;
    }

    @media (max-width: 450px) {
      margin-top: 24px;
    }
  `,

  colorButton: styled.css`
    width: 64px;
    height: 48px;
    border-radius: 8px;
    transition: outline 0.2s;
    border: 3px solid ${theme.background};
    outline: 0px solid ${theme.background};

    &--skew {
      transform: skewY(${SKEW_DEG}deg) skewX(-12deg);
    }

    @media (max-width: 450px) {
      width: 56px;
    }
  `,
});

export const WebGLShaderLoader = (
  props: Omit<WebGLShaderProps, "colorConfiguration"> & {
    colorConfiguration?: ColorConfiguration | ColorConfiguration[];
  },
) => {
  const { skew } = props;
  const s = useStyles(styles);

  const colorConfigurationArr = Array.isArray(props.colorConfiguration)
    ? props.colorConfiguration
    : [props.colorConfiguration ?? "default"];
  const [colorConfiguration, setColorConfiguration] = useState(colorConfigurationArr[0]);

  const ref = useRef<HTMLDivElement>(null);
  const visible = useVisible(ref, "64px");

  return (
    <div className={[s("container", { skew }), "canvas"].join(" ")} ref={ref}>
      <WebGLShaderPropsContext.Provider value={props}>
        {visible ? (
          <WebGLShader {...props} colorConfiguration={colorConfiguration} />
        ) : (
          <WebGLShaderSkeleton />
        )}
      </WebGLShaderPropsContext.Provider>
      {colorConfigurationArr.length > 1 && (
        <div className={s("colorButtonWrapper", { skew })}>
          {colorConfigurationArr.map((key) => {
            const gradient = colorConfigurations[key].gradient;
            const selected = key === colorConfiguration;
            return (
              <button
                className={s("colorButton", { skew })}
                key={key}
                style={{
                  background: gradientToThreeStopGradient(gradient),
                  outline: selected
                    ? `5px solid ${gradient[Math.floor(gradient.length / 2)]}`
                    : undefined,
                }}
                onClick={() => setColorConfiguration(key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

function gradientToThreeStopGradient(gradient: string[]) {
  const [a, b, c] = pick3(gradient);
  return `linear-gradient(90deg, ${a} 0%, ${a} 33.2%, ${b} 33.3%, ${b} 66.5%, ${c} 66.6%, ${c} 100%)`;
}

function pick3<T>(arr: T[]): T[] {
  const N = arr.length;
  if (N < 3) throw new Error("Array must have at least 3 elements");
  if (N === 3) return arr;
  return [0.25, 0.5, 0.75].map((t) => arr[Math.floor((N - 1) * t)]);
}
