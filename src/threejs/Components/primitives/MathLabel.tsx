import { useContext, useMemo, useRef } from "react";
import type * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";
import { getMathSvg, getMathSvgOffset } from "../../math-svg";
import { getBasicMaterial, IVector3, parseVector } from "../../utils";
import { FiberContext, ThreeContext } from "../ThreeProvider";

const scaleFac = 0.004;

interface Props {
  label: string;
  position: IVector3;
  normal?: IVector3;
  scale?: number;
  autoScale?: boolean;
  offset?: IVector3;
}

export const MathLabel: React.FC<Props> = (props) => {
  const autoScale = props.autoScale ?? true;

  const userScale = props.scale ?? 1;

  const THREE = useContext(ThreeContext);
  const FIBER = useContext(FiberContext);

  const geometries = useMemo(() => {
    let svg = getMathSvg(props.label);
    if (!svg) return [];
    svg = svg.replaceAll('"currentColor"', '"white"');

    const loader = new SVGLoader();
    const svgData = loader.parse(svg!);

    const geometries: THREE.ExtrudeGeometry[] = [];

    for (const path of svgData.paths) {
      for (const shape of path.toShapes(true)) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 0.3,
          bevelEnabled: false,
        });
        geometries.push(geometry);
      }
    }
    return geometries;
  }, [props.label]);

  const orgMesh = useMemo(() => {
    const mesh = new THREE.Mesh();
    mesh.position.set(0, 0, 0.00001);
    if (props.normal) mesh.lookAt(parseVector(THREE, props.normal));
    return mesh;
  }, [props.normal]);

  const invMesh = useMemo(() => {
    const mesh = new THREE.Mesh();
    mesh.position.set(0, 0, 0.00001);
    if (props.normal) mesh.lookAt(parseVector(THREE, props.normal).multiplyScalar(-1));
    return mesh;
  }, [props.normal]);

  const groupRef = useRef<THREE.Group>(null);
  FIBER.useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    // Make label appear fixed-size
    const distance = group.position.distanceTo(state.camera.position);
    const scale = autoScale ? distance * userScale * scaleFac : userScale * 0.06;
    group.scale.set(scale, scale, scale);
    const { x, y, z } = parseVector(THREE, props.position);
    group.position.set(x, y, z);

    if (props.normal) {
      const mesh = new THREE.Mesh();
      mesh.position.set(group.position.x, group.position.y, group.position.z);

      const cameraPosition = state.camera.position;
      mesh.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
      mesh.lookAt(group.position);

      const lookNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);

      const normal = parseVector(THREE, props.normal);
      const angle = normal.angleTo(lookNormal);

      const quat = angle > Math.PI / 2 ? orgMesh.quaternion : invMesh.quaternion;
      group.quaternion.set(quat.x, quat.y, quat.z, quat.w);

      let offsetXY = getMathSvgOffset(props.label) || [0, 0];

      const offset = new THREE.Vector3(offsetXY[0] * -scale, offsetXY[1] * scale, 0)
        .applyQuaternion(quat)
        .add(parseVector(THREE, props.offset).applyQuaternion(orgMesh.quaternion));
      group.position.add(offset);
    } else {
      const cameraPosition = state.camera.position.clone();

      // This offset fixes the look-at rotation when looking straight up/down
      const vec = new THREE.Vector3(0, cameraPosition.y > 0 ? -10 : 10, 100).applyQuaternion(
        state.camera.quaternion,
      );
      cameraPosition.add(vec);

      group.lookAt(cameraPosition);
      const offset = parseVector(THREE, props.offset)
        .applyQuaternion(state.camera.quaternion)
        .multiplyScalar(scale * 18);
      group.position.add(offset);
    }
  });

  return (
    <group scale={0} ref={groupRef} quaternion={orgMesh.quaternion}>
      {geometries.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={getBasicMaterial(THREE, 0xffffff)}
          rotation={[Math.PI, 0, 0]}
        />
      ))}
    </group>
  );
};
