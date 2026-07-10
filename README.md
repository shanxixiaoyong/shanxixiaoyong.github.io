# 刘勇 / Yong Liu Personal Space

This repository serves the public personal space for Liu Yong / Yong Liu:

https://shanxixiaoyong.github.io/

The root page is a framework-free GitHub Pages portal with four public entries:

- personal academic homepage: `home.html`
- personal knowledge base: `knowledge.html`, generated from `data/knowledge.json`
- small toolbox: `tools.html`
- mini games: `games.html`

The academic homepage is focused on:

- self-supervised fundus image analysis and medical vision;
- piezoelectric touch and force sensing;
- wearable health sensing and intelligent assessment systems;
- publications, conference papers, patents, and selected profile information.

Current affiliations:

- National Key Laboratory of Land and Air Based Information Perception and Control, Xi’an 710065, Shaanxi, China
- Xi’an Modern Control Technology Research Institute, Xi’an 710065, Shaanxi, China

Public profile links:

- Email: yongliu@buaa.edu.cn
- GitHub: https://github.com/shanxixiaoyong
- ORCID: https://orcid.org/0000-0002-7584-2953

## Maintenance

The site is implemented as static HTML, CSS, and JavaScript. Publication, patent, bilingual copy, and academic-page interaction data are maintained in `assets/academic.js`, while `home.html` provides the semantic document shell.

The knowledge base index can be regenerated from the local Obsidian-style markdown vault:

```bash
node tools/sync-obsidian.mjs /Users/yong/Documents/Codex/codex-knowledge-base/vault data/knowledge.json
```

Run the local smoke check before publishing:

```bash
node tools/validate-site.mjs
```
