import { useContext, useMemo } from "react";
import { Plane } from "../../math/Plane";
import { planePlaneIntersection } from "../../math/planePlaneIntersection";
import { Grid } from "../Components/primitives/Grid";
import { Line } from "../Components/primitives/Line";
import { Plane as RenderPlane } from "../Components/primitives/Plane";
import { Point } from "../Components/primitives/Point";
import { ThreeContext } from "../Components/ThreeProvider";
import { createScene } from "../createScene";

export default createScene(
  ({ variables }) => {
    const { n1 } = variables;
    const THREE = useContext(ThreeContext);

    const n0 = new THREE.Vector3(1, 0.5, -0.1).normalize();

    const p0 = new THREE.Vector3(0, 0, 0);
    const p1 = new THREE.Vector3(0, 0, 0);

    const plane0 = Plane.fromPointAndNormal(p0, n0);
    const plane1 = Plane.fromPointAndNormal(p1, n1);

    const intersection = planePlaneIntersection(plane0, plane1);

    const N = 76;
    const points = useMemo(() => {
      const out: React.ReactNode[] = [];
      for (let i = 0; i < N; i++) {
        const off = N / 2 - i;
        const pos = new THREE.Vector3(0, 0, off / 1.4);
        const radius = 0.05 - Math.abs(off / 1500);
        if (radius < 0) continue;
        out.push(<Point color="white" position={pos} radius={radius} key={i} />);
      }
      return out;
    }, []);

    const mesh = new THREE.Mesh();
    mesh.lookAt(intersection?.normal || new THREE.Vector3(1, 0, 0));

    return (
      <>
        <RenderPlane normal={plane0.normal} distance={plane0.distance} color="blue" />
        <RenderPlane normal={plane1.normal} distance={plane1.distance} color="red" />
        {intersection && (
          <>
            <mesh position={intersection.point} quaternion={mesh.quaternion}>
              {points}
            </mesh>
            <Line
              from={intersection.point.clone().sub(intersection.normal.clone().multiplyScalar(100))}
              to={intersection.point.clone().add(intersection.normal.clone().multiplyScalar(100))}
              color={0x666666}
              radius={0.02}
            />
          </>
        )}
        <Grid size={10} light />
      </>
    );
  },
  {
    variables: {
      n1: { label: "math:vec_n", type: "normal", value: [0.5, 1, -0.1] },
    },
  },
);
