from ..chart import create_chart, Line

lines = [
    Line(label=r"$x^6$", fn=lambda t: t**6, color="#f43a9e"),
    Line(label=r"$x^5$", fn=lambda t: t**5, color="#3af49e"),
    Line(label=r"$x^4$", fn=lambda t: t**4, color="#9e3af4"),
    Line(label=r"$x^3$", fn=lambda t: t**3, color="#f49e3a"),
    Line(label=r"$x^2$", fn=lambda t: t**2, color="#399ef4"),
    Line(label=r"$x^1$", fn=lambda t: t**1, color="#f4e33a"),
]

create_chart(
    file_path="public/images/posts/webgl-gradients/x-pow-n-chart.png",
    lines=lines,
    x_axis_label="$x$",
    y_axis_label=r"$x^n$",
    line_width=1.2,
)
