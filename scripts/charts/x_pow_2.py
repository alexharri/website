from ..chart import create_chart, Line

lines = [
    Line(
        fn=lambda t: t**2,
    ),
]

create_chart(
    file_path="public/images/posts/webgl-gradients/x-pow-2-chart.png",
    lines=lines,
    x_axis_label="$x$",
    y_axis_label=r"$x^2$",
)
