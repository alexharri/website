from ..trie import create_trie_chart

create_trie_chart(
    file_path="public/images/posts/icelandic-name-declension-trie/ur-divergence-1",
    quote_values=True,
    trie={
        "r": {
            "u": {
                "f": {"l": {"Y": {"value": "2;ur,i,i,ar"}}},
                "t": {"ú": {"n": {"K": {"value": "2;ur,,i,s"}}}},
                "g": {"u": {"a": {"B": {"value": "2;ur,,i,s"}}}},
                "m": {"í": {"r": {"G": {"value": "2;ur,,i,s"}}}},
            }
        }
    },
)
