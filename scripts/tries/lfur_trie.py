from ..trie import create_trie_chart

trie = {
    "r": {
        "u": {
            "f": {
                "l": {
                    "ú": {"value": "ur,,i,s"},
                    "ó": {"value": "ur,,i,s"},
                    "Á": {"value": "ur,,i,s"},
                    "E": {"value": "ur,i,i,ar"},
                    "Ú": {"value": "ur,,i,s"},
                    "Y": {"value": "ur,i,i,ar"},
                    "e": {"value": "ur,i,i,ar"},
                }
            }
        }
    }
}


create_trie_chart(
    file_path="public/images/posts/icelandic-name-declension-trie/lfur-trie",
    trie=trie,
    quote_values=False,
)
