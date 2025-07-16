from ..trie import create_trie_chart

create_trie_chart(
    file_path="public/images/posts/encoding-declension/ur-divergence",
    quote_values=True,
    trie={
      "r": {
          "u": {
              "f": {
                  "l": {
                      "Y": { "value": "2;ur,i,i,ar" }
                  }
              },
              "t": {
                  "ú": {
                      "n": {
                          "K": { "value": "2;ur,,i,s" }
                      },
                      "r": {
                          "H": { "value": "2;ur,,i,s" }
                      }
                  },
                  "f": {
                      "o": {
                          "L": { "value": "2;ur,,i,s" }
                      }
                  }
              }
          }
      }
  }
)