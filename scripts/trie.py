import os
import subprocess

from graphviz import Digraph

FONT = "Fira Code"
NODE_COLOR = "#486d8c"
COLOR = "#B9DBFA"


def create_trie_chart(
    *, file_path: str, trie, quote_values: bool = False, horizontal: bool = False
):
    dot = Digraph(format="svg")

    rankdir = "TB" if horizontal else "LR"
    nodesep = "0.3" if horizontal else "0.2"
    ranksep = "0.5" if horizontal else "0.4"

    dot.attr(
        bgcolor="transparent",
        rankdir=rankdir,
        fontname=FONT,
        fontpath="",
        nodesep=nodesep,
        ranksep=ranksep,
    )

    dot.attr(
        "node",
        shape="box",
        style="rounded",
        color=NODE_COLOR,
        fontname=FONT,
        fontcolor=COLOR,
        penwidth="2",
        height="0.4",
        width="0.4",
        fixedsize="false",
        margin="0.12,0.02",
    )

    dot.attr(
        "edge",
        color=COLOR,
        fontname=FONT,
        fontcolor=COLOR,
        penwidth="2",
        arrowhead="normal",
        arrowsize="0.8",
    )

    levels = {}
    value_nodes = []
    counter = [0]

    def add_nodes(trie_node, parent_name, depth=0):
        if depth not in levels:
            levels[depth] = []

        for key, value in trie_node.items():
            if key == "value":
                value_node = f"{parent_name}_val"
                value_text = f'"{value}"' if quote_values else str(value)
                dot.node(
                    value_node,
                    value_text,
                    shape="box",
                    style="",
                    color=NODE_COLOR,
                    fontname=FONT,
                    fontcolor=COLOR,
                )
                dot.edge(parent_name, value_node)
                value_nodes.append(value_node)
            else:
                node_name = f"{parent_name}_{counter[0]}"
                counter[0] += 1
                dot.node(node_name, key)
                dot.edge(parent_name, node_name)
                levels[depth].append(node_name)
                add_nodes(value, node_name, depth + 1)

    dot.node("root", "root")
    levels[0] = ["root"]
    add_nodes(trie, "root", 1)

    for nodes in levels.values():
        if len(nodes) > 1:
            with dot.subgraph() as s:
                s.attr(rank="same")
                for node in nodes:
                    s.node(node)

    if value_nodes:
        with dot.subgraph() as s:
            s.attr(rank="same")
            for value_node in value_nodes:
                s.node(value_node)

    abs_file_path = os.path.abspath(os.path.join(os.getcwd(), file_path))
    dot.render(abs_file_path, view=False, cleanup=True)

    subprocess.run(
        [
            "inkscape",
            "--export-text-to-path",
            "--export-plain-svg",
            f"--export-filename={abs_file_path}.svg",
            f"{abs_file_path}.svg",
        ],
        check=True,
        capture_output=True,
    )

    print(f"\n\n\tCreated SVG file with text as paths at {file_path}.svg\n")
