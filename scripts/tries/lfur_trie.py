from ..trie import create_trie_chart

trie = {
  "r": {
    "u": {
      "f": {
        "l": {
          "ú": { "value": "2;ur,,i,s" },
          "ó": { "value": "2;ur,,i,s" },
          "Á": { "value": "2;ur,,i,s" },
          "E": { "value": "2;ur,i,i,ar" },
          "Ú": { "value": "2;ur,,i,s" },
          "Y": { "value": "2;ur,i,i,ar" },
          "e": { "value": "2;ur,i,i,ar" }
        }
      }
    }
  }
}






create_trie_chart(
    file_path="public/images/posts/encoding-declension/lfur-trie",
    trie=trie,
    quote_values=False
)

