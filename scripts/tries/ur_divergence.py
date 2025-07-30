from ..trie import create_trie_chart

create_trie_chart(
    file_path="public/images/posts/icelandic-name-declension-trie/ur-divergence",
    quote_values=True,
    trie={
        "r": {
            "u": {
                "f": {"l": {"Y": {"value": "ur,i,i,ar"}}},
                "t": {
                    "ú": {"n": {"K": {"value": "ur,,i,s"}}, "r": {"H": {"value": "ur,,i,s"}}},
                    "f": {"o": {"L": {"value": "ur,,i,s"}}},
                },
            }
        }
    },
)
