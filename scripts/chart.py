import argparse
from dataclasses import dataclass
import os
from typing import Callable
import numpy as np
import matplotlib.pyplot as plt

white = "#B9DBFA"
grid_color = "#2B394E"
background_color = "none"


@dataclass
class Line:
    fn: Callable[[float], float]
    label: str | None = None
    color: str | None = "#399ef4"
    style: str | None = None
    width: float | None = None


def create_chart(
    *,
    file_path: str,
    lines: list[Line],
    range=[0, 1],
    size=(4.5, 4),
    line_width: int = 2,
    x_axis_label: str | None = None,
    y_axis_label: str | None = None,
):
    t_values = np.linspace(range[0], range[1], 100)

    plt.figure(figsize=size, facecolor=background_color)
    ax = plt.gca()
    ax.set_facecolor(background_color)

    for line in lines:
        plt.plot(
            t_values,
            line.fn(t_values),
            label=line.label,
            color=line.color,
            linewidth=line.width or line_width,
            linestyle=line.style,
        )

    plt.xlabel(x_axis_label, color=white)
    plt.ylabel(y_axis_label, color=white, rotation=0, labelpad=15)
    plt.grid(True, color=grid_color)

    if next((line.label for line in lines if line.label), None):
        plt.legend(facecolor=background_color, edgecolor=white, labelcolor=white)

    ax.spines["bottom"].set_color(white)
    ax.spines["left"].set_color(white)
    ax.xaxis.label.set_color(white)
    ax.yaxis.label.set_color(white)
    ax.tick_params(colors=white)

    relative_file_path = file_path
    file_path = os.path.abspath(os.path.join(os.getcwd(), file_path))

    plt.savefig(file_path, dpi=300, bbox_inches="tight", pad_inches=0)

    print(f"\n\n\tCreated chart at {relative_file_path}\n")
