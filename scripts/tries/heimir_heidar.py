from ..trie import create_trie_chart

create_trie_chart(
    file_path="public/images/posts/encoding-declension/heimir-heidar-trie",
    quote_values=True,
    trie={
        "H": {
            "e": {
                "i": {
                    "m": {
                        "i": {
                            "r": { "value": "1;r,,,s" }
                        }
                    },
                    "ð": {
                        "a": {
                            "r": { "value": "1;r,,i,s" }
                        }
                    }
                }
            }
        }
    }
)