import os
from graphviz import Digraph

FONT = "monospace"
COLOR = "#B9DBFA"

def create_trie_chart(
    *,
    file_path: str,
    trie,
    quote_values: bool = False,
    horizontal: bool = False
):
  dot = Digraph(format='svg')
  
  if horizontal:
      # Horizontal layout: top-to-bottom with adjusted spacing
      dot.attr(bgcolor='transparent', rankdir='TB', fontname=FONT, fontpath="", nodesep='0.4', ranksep='0.6')
  else:
      # Vertical layout: left-to-right (original)
      dot.attr(bgcolor='transparent', rankdir='LR', fontname=FONT, fontpath="", nodesep='0.3', ranksep='0.4')
  
  dot.attr('node', shape='circle', color=COLOR, fontname=FONT, fontcolor=COLOR, penwidth='2')
  dot.attr('edge', color=COLOR, fontname=FONT, fontcolor=COLOR, penwidth='2', arrowhead='normal', arrowsize='0.8')

  # Collect nodes by their depth level for proper alignment
  levels = {}
  value_nodes = []

  def add_nodes(trie, parent_name, counter, depth=0):
      if depth not in levels:
          levels[depth] = []
      
      for key, value in trie.items():
          if key == "value":
              # Add value node
              value_node = f"{parent_name}_val"
              dot.node(
                value_node,
                f'"{value}"' if quote_values else str(value), 
                shape='box', 
                color=COLOR, 
                fontname=FONT, 
                fontcolor=COLOR
              )
              dot.edge(parent_name, value_node)
              value_nodes.append(value_node)
          else:
              node_name = f"{parent_name}_{counter[0]}"
              counter[0] += 1
              dot.node(node_name, key)
              dot.edge(parent_name, node_name)
              levels[depth].append(node_name)
              add_nodes(value, node_name, counter, depth + 1)

  dot.node("root", "root")
  levels[0] = ["root"]
  add_nodes(trie, "root", [0], 1)

  # Align nodes at each depth level
  for level, nodes in levels.items():
      if len(nodes) > 1:
          with dot.subgraph() as s:
              s.attr(rank='same')
              for node in nodes:
                  s.node(node)

  # Align value boxes based on layout direction
  if value_nodes:
      with dot.subgraph() as s:
          s.attr(rank='same')
          for value_node in value_nodes:
              s.node(value_node)

  relative_file_path = file_path
  file_path = os.path.abspath(os.path.join(os.getcwd(), file_path))

  dot.render(file_path, view=False, cleanup=True)

  print(f"\n\n\tCreated SVG file at {relative_file_path}.svg\n")