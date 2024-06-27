import { useMemo } from "react";
import { StyleOptions, useStyles } from "../../../utils/styles";
import { createGuideExample } from "./generators/GuideExample";

const styles = ({ styled }: StyleOptions) => ({
  wrapper: styled.css`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    margin: 40px auto;
  `,
});

export const Guides = () => {
  const s = useStyles(styles);

  // const [amplitude, setAmplitude, amplitudeRef] = useStateRef(1);

  const GuideExample = useMemo(() => {
    return createGuideExample(() => {
      // const speed = 3;
      // const wiggleX = createWiggle();
      // const wiggleY = createWiggle();
      // return () => {
      //   const amplitude = amplitudeRef.current;
      //   return [wiggleX(speed, amplitude), wiggleY(speed, amplitude)];
      // };
      return () => [0, 0];
    });
  }, []);

  return (
    <div className={s("wrapper")}>
      <GuideExample />
      {/* <Slider label="Amplitude" value={amplitude} setValue={setAmplitude} range={[0.2, 3]} /> */}
    </div>
  );
};
