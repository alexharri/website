from ..trie import create_trie_chart

trie = {
    "r": {
        "u": {
            "f": {
                "l": {
                    "value": "7 leaf nodes",
                },
                "í": {"v": {"value": "ur,ur,ri,urs"}, "l": {"value": "ur,,i,s"}},
                "ióúa": {"value": "ur,,i,s"},
            }
        }
    }
}

create_trie_chart(
    file_path="public/images/posts/icelandic-name-declension-trie/fur-trie-leaves-merged",
    quote_values=True,
    trie=trie,
)
