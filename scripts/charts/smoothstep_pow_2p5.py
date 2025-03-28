import numpy as np
from ..chart import create_chart, Line


def smoothstep(t):
    return t * t * t * (t * (6.0 * t - 15.0) + 10.0)


lines = [
    Line(
        label="No smoothing",
        fn=lambda t: np.clip(0.5 + t, 0, 1),
        color="#1D9C74",
        style=":",
        width=1.2,
    ),
    Line(
        label="smoothstep",
        fn=lambda t: smoothstep(np.clip(0.5 + t, 0, 1)),
        color="#9A1D9C",
        style=":",
        width=1.2,
    ),
    Line(
        label="smoothstep and pow 2.5",
        fn=lambda t: smoothstep(np.clip(0.5 + t, 0, 1)) ** 2.5,
    ),
]

create_chart(
    file_path="public/images/posts/webgl-gradients/smoothstep-pow-2p5-chart.png",
    lines=lines,
    size=(6, 4),
    range=[-0.7, 0.7],
    x_axis_label="dist / blur",
    y_axis_label=r"Alpha",
)
