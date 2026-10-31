# Reference documents

The source PDFs are copyrighted, so they are **not stored in git**. They are attached to the private
[`reference-docs` release](https://github.com/asilachev/splendor-marvel-automa/releases/tag/reference-docs).
Download them into this folder, where they are gitignored, with:

```sh
npm run reference   # gh release download reference-docs → docs/reference/*.pdf
```

You need an authenticated `gh` CLI with access to the repo.

| File | What | Original source |
| --- | --- | --- |
| `splendor-marvel-rulebook-en.pdf` | Official English rulebook (4 pages). © 2020 Space Cowboys, © MARVEL | [Harris-Elmore Public Library copy](https://harriselmorelibrary.org/_files/ugd/46b448_8386770ea2af4e34ae404782bdcbc555.pdf) · [BGG](https://boardgamegeek.com/boardgame/293296/splendor-marvel) |
| `splendor-marvel-solo-automa-v1.pdf` | Solo Automa V1. Automa by Dukefanblue2005, Marvel re-theme by Shamus | [BGG file page](https://boardgamegeek.com/filepage/215783) |

Text summaries are in [`../rules.md`](../rules.md) and [`../automa.md`](../automa.md).

> **Copyright.** These PDFs belong to their authors and are for personal reference only. Never commit
> them. The bootstrap commit still contains them in the history; purging that, and deleting the
> release, is part of the go-public checklist (#17).
