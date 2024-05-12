import { useContext, useMemo, useState } from "react";
import { linePlaneIntersection } from "../../math/linePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Plane } from "../Components/primitives/Plane";
import { Vector } from "../Components/primitives/Vector";
import { ThreeContext } from "../Components/ThreeProvider";
import { VRController } from "../Components/VRController";
import { createScene } from "../createScene";
import { Plane as PlaneClass } from "../../math/Plane";
import { Point } from "../Components/primitives/Point";
import { createWiggle } from "../../math/wiggle";
import { useFrame } from "@react-three/fiber";

export default createScene(
  ({ variables }) => {
    let { distance } = variables;
    distance **= 2;
    distance -= 5;

    const THREE = useContext(ThreeContext);

    // DIRTY HACK: Trigger rerender on every frame
    const [_, setN] = useState(0);
    useFrame(() => setN((n) => n + 1));

    const wiggle1X = useMemo(() => createWiggle(), []);
    const wiggle1Y = useMemo(() => createWiggle(), []);

    const wiggle2X = useMemo(() => createWiggle(), []);
    const wiggle2Y = useMemo(() => createWiggle(), []);
    const wiggle2Z = useMemo(() => createWiggle(), []);

    const rootNormal = new THREE.Vector3(0, 0.1, 1).normalize();
    const rootPos = new THREE.Vector3(0, 1, -3)
      .add(new THREE.Vector3(wiggle2X(2, 0.01), wiggle2Y(2, 0.01), wiggle2Z(2, 0.001)))
      .add(rootNormal.clone().multiplyScalar(-(0.8 + distance)));

    const normal = new THREE.Vector3(wiggle1X(2, 0.004), 0.1 + wiggle1Y(2, 0.004), 1).normalize();
    const position = rootPos.clone().add(normal.multiplyScalar(0.8));

    const planeNormal = new THREE.Vector3(0, 0.1, 1).normalize();
    const planePoint = new THREE.Vector3(0, 1.7, 4);
    const plane = PlaneClass.fromPointAndNormal(planePoint, planeNormal);

    const intersection =
      linePlaneIntersection(plane, normal, position) ?? new THREE.Vector3(0, 0, 0);

    const rayStart = position.clone().add(normal.clone().multiplyScalar(0.35));
    const len = rayStart.distanceTo(intersection);
    const rayEnd = rayStart.clone().lerp(intersection!, (len - 1) / len);

    return (
      <mesh rotation={[0, 1, 0]}>
        <Plane normal={planeNormal} position={planePoint} width={2} color="white" />
        <Point color="white" position={intersection} />
        <Point color="red" position={rayStart} />
        <Vector color="red" from={rayStart} to={rayEnd} />
        <VRController normal={normal} position={position} />
        <Grid size={6} />
      </mesh>
    );
  },
  {
    variables: {
      distance: { type: "number", value: 2.2, range: [0, 6] },
    },
  },
);
