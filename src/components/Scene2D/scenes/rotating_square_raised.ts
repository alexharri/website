import { colors } from "../../../utils/cssVariables";
import { createScene2D } from "../createScene2D";

export default createScene2D(({ ctx, width, height, elapsed }) => {
  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  ctx.fillStyle = colors.background300;
  ctx.fill();

  const x = width / 2;
  const y = height / 2 - 24;
  const squareSize = height * 0.5;

  // Draw white rotating square
  ctx.save(); // Save current context state
  ctx.translate(x, y); // Move origin to center
  ctx.rotate(elapsed * 0.0005); // Rotate based on elapsed time (adjust speed as needed)

  ctx.fillStyle = "white";
  ctx.fillRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);

  ctx.restore(); // Restore context state
}, {});
