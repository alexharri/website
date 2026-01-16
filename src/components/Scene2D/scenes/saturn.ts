import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

let img: HTMLImageElement | undefined;
let loaded = false;

function getImage() {
  if (loaded) return img;
  if (img) return;
  img = new Image();
  img.src = "/images/posts/ascii-rendering/saturn.jpg";
  img.crossOrigin = "anonymous";
  img.onload = () => {
    loaded = true;
  };
}

export default createScene2D(
  ({ ctx, width, height }) => {
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = colors.background300;
    ctx.fill();

    const img = getImage();
    if (!img) {
      return;
    }

    ctx.drawImage(img, 0, 0, width, height);
  },
  {
    static: true,
    variables: {},
    isLoading: () => !loaded,
  },
);
