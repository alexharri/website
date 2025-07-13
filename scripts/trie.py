import os
from graphviz import Digraph

FONT = "monospace"
COLOR = "#B9DBFA"

def create_trie_chart(
    *,
    file_path: str,
    trie,
):
  dot = Digraph(format='svg')
  dot.attr(bgcolor='transparent', rankdir='LR', fontname=FONT, fontpath="", nodesep='0.3', ranksep='0.4')
  dot.attr('node', shape='circle', color=COLOR, fontname=FONT, fontcolor=COLOR, penwidth='2')
  dot.attr('edge', color=COLOR, fontname=FONT, fontcolor=COLOR, penwidth='2', arrowhead='normal', arrowsize='0.8')

  def add_nodes(trie, parent_name, counter):
      for key, value in trie.items():
          if key == "value":
              # Add value node to the right of parent
              value_node = f"{parent_name}_val"
              dot.node(
                value_node,
                f'"{value}"', 
                shape='box', 
                color=COLOR, 
                fontname=FONT, 
                fontcolor=COLOR
              )
              dot.edge(parent_name, value_node)
          else:
              node_name = f"{parent_name}_{counter[0]}"
              counter[0] += 1
              dot.node(node_name, key)
              dot.edge(parent_name, node_name)
              add_nodes(value, node_name, counter)

  dot.node("root", "root")
  add_nodes(trie, "root", [0])

  relative_file_path = file_path
  file_path = os.path.abspath(os.path.join(os.getcwd(), file_path))

  dot.render(file_path, view=False, cleanup=True)

  print(f"\n\n\tCreated SVG file at {relative_file_path}.svg\n")