from ..trie import create_trie_chart

trie = {
    "i": {
        "bdfjklmnpstvxðóú": {"value": "1;i,a,a,a (166)"},
        "r": {
            "Aadefgimrtáóúý": {"value": "1;i,a,a,a (33)"},
            "y": {"value": "0;,,, (1)"},
        },
        "g": {
            "alnou": {"value": "1;i,a,a,a (14)"},
            "g": {
                "Uaiouö": {"value": "1;i,a,a,a (6)"},
                "e": {"value": "1;i,ja,ja,ja (1)"},
            },
        },
        "u": {"value": "1;i,ja,ja,ja (1)"},
        "a": {"value": "0;,,,s (1)"},
    }
}

create_trie_chart(
    file_path="public/images/posts/encoding-declension/i-trie",
    quote_values=False,
    trie=trie,
)
