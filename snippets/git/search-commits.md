---
title: "Search Git commits"
showPreview: true
publishedAt: "23-07-2024"
---

To find the commits whose diff includes a certain word or phrase:

```bash
git log -S "<code>" --format=oneline
```

This will search the current branch for mentions of that word. To search on all branches, you can use:

```bash
git log -S "<code>" --source --all
```

`--all` tells `git log` to look at all branches, while `--source` tells it to specify which branch (ref name) the commit comes from.