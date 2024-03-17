import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { createScene } from "../createScene";

export default createScene(() => {
  return (
    <>
      <Plane normal={new Vector3(1, -2, 3).normalize()} color="blue" />
      <Grid size={10} />
    </>
  );
});
