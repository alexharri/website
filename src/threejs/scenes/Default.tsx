import { Vector3 } from "three";
import { Grid } from "../Components/Grid";
import { Plane } from "../Components/Plane";
import { Vector } from "../Components/Vector";
import { createScene } from "../createScene";

export default createScene(() => {
  return (
    <>
      <Vector to={[1, 0, 0]} color="red" />
      <Vector to={[0, 1, 0]} color="green" />
      <Vector to={[0, 0, 1]} color="blue" />
      <Plane distance={1} normal={new Vector3(1, 1, 0).normalize()} color="blue" showNormal />
      <Grid size={10} />
    </>
  );
});
