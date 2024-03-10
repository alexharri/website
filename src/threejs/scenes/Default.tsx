import { Grid } from "../Components/Grid";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(() => {
  return (
    <>
      <Vector to={[1, 0, 0]} color="red" />
      <Vector to={[0, 1, 0]} color="green" />
      <Vector to={[0, 0, 1]} color="blue" />
      <Grid size={10} />
    </>
  );
});
