import numpy as np
from ..chart import create_chart, Line


lines = [
    Line(
        label="clamp(0.5 + dist / blur, 0, 1)",
        fn=lambda t: np.clip(0.5 + t, 0, 1),
    ),
]

create_chart(
    file_path="public/images/posts/webgl-gradients/linear-clamped-chart.png",
    lines=lines,
    size=(6, 4),
    range=[-0.7, 0.7],
    x_axis_label="dist / blur",
    y_axis_label=r"Alpha",
)
