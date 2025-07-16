from ..trie import create_trie_chart

trie = {
    "i": {
        "bdfjklmnpstvxðóú": {"value": "1;i,a,a,a (166 names)"},
        "r": {
            "Aadefgimrtáóúý": {"value": "1;i,a,a,a (33 names)"},
            "y": {"value": "0;,,, (1 names)"},
        },
        "g": {
            "alnou": {"value": "1;i,a,a,a (14 names)"},
            "g": {
                "Uaiouö": {"value": "1;i,a,a,a (6 names)"},
                "e": {"value": "1;i,ja,ja,ja (1 names)"},
            },
        },
        "u": {"value": "1;i,ja,ja,ja (1 names)"},
        "a": {"value": "0;,,,s (1 names)"},
    }
}

create_trie_chart(
    file_path="public/images/posts/encoding-declension/i-trie",
    quote_values=True,
    trie=trie,
)
