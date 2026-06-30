# 刘勇 / Yong Liu Academic Homepage

This repository serves the public academic homepage for Liu Yong / Yong Liu:

https://shanxixiaoyong.github.io/

The site is a framework-free GitHub Pages page focused on:

- self-supervised fundus image analysis and medical vision;
- piezoelectric touch and force sensing;
- wearable health sensing and intelligent assessment systems;
- publications, manuscripts, patents, and selected profile information.

Public profile links:

- Email: yongliu@buaa.edu.cn
- GitHub: https://github.com/shanxixiaoyong
- ORCID: https://orcid.org/0000-0002-7584-2953

## Maintenance

The page is implemented as a static `index.html`. Publication and patent records are stored as structured JavaScript arrays in that file, so updates only require editing the relevant data entries and pushing to `master`.

Run the local smoke check before publishing:

```bash
node tools/validate-site.mjs
```
