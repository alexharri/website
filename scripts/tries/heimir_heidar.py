from ..trie import create_trie_chart

create_trie_chart(
    file_path="public/images/posts/icelandic-name-declension-trie/heimir-heidar-trie",
    quote_values=True,
    trie={
        "H": {
            "e": {
                "i": {
                    "m": {"i": {"r": {"value": "r,,,s"}}},
                    "ð": {"a": {"r": {"value": "r,,i,s"}}},
                }
            }
        }
    },
)
