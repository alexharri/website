from ..trie import create_trie_chart

trie = {
    "r": {
        "u": {
            "f": {
                "l": {
                    "value": "7 leaf nodes",
                },
                "í": {"v": {"value": "2;ur,ur,ri,urs"}, "l": {"value": "2;ur,,i,s"}},
                "i": {"value": "2;ur,,i,s"},
                "ó": {"value": "2;ur,,i,s"},
                "ú": {"value": "2;ur,,i,s"},
                "a": {"value": "2;ur,,i,s"},
            }
        }
    }
}


create_trie_chart(
    file_path="public/images/posts/encoding-declension/fur-trie", quote_values=True, trie=trie
)
