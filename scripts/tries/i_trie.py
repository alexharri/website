from ..trie import create_trie_chart

trie = {
    "i": {
        "bdfjklmnpstvxðóú": {"value": "i,a,a,a (166)"},
        "r": {
            "Aadefgimrtáóúý": {"value": "i,a,a,a (33)"},
            "y": {"value": ",,, (1)"},
        },
        "g": {
            "alnou": {"value": "i,a,a,a (14)"},
            "g": {
                "Uaiouö": {"value": "i,a,a,a (6)"},
                "e": {"value": "i,ja,ja,ja (1)"},
            },
        },
        "u": {"value": "i,ja,ja,ja (1)"},
        "a": {"value": ",,,s (1)"},
    }
}

create_trie_chart(
    file_path="public/images/posts/icelandic-name-declension-trie/i-trie",
    quote_values=False,
    trie=trie,
)
