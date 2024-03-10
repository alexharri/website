import { Grid } from "../Components/Grid";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(() => {
  return (
    <>
      <Vector to={[1, 1, 0]} />
      <Grid size={10} />
    </>
  );
});
