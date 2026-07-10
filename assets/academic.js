(() => {
  "use strict";

  const themeLabels = {
    classic: { zh: "作品集", en: "Folio" },
    journal: { zh: "手稿", en: "Manuscript" },
    minimal: { zh: "网格", en: "Grid" },
    lab: { zh: "信号", en: "Signal" },
    gallery: { zh: "展映", en: "Cinema" }
  };

  const uiText = {
    zh: {
      title: "刘勇 / Yong Liu - Academic Homepage",
      description: "刘勇 / Yong Liu 的个人学术主页，展示医学影像自监督学习、压电触摸力感知、可穿戴健康与智能系统方向的论文和专利。",
      skip: "跳到正文",
      headerHome: "回到页面顶部",
      headerSubtitle: "Research folio",
      controlsLabel: "显示设置",
      themeLabel: "选择视觉风格",
      languageLabel: "语言",
      worldAria: "返回个人天地",
      world: "天地",
      nav: ["研究", "论文", "专利", "经历", "联系"],
      mobileNav: [
        { label: "封面", aria: "封面" },
        { label: "研究", aria: "研究方向" },
        { label: "论文", aria: "论文" },
        { label: "专利", aria: "专利" },
        { label: "经历", aria: "经历" }
      ],
      coverEdition: "Research folio",
      coverKicker: "医学视觉 · 智能传感 · 健康系统",
      namePrimary: "刘勇",
      nameSecondary: "Yong Liu",
      coverLede: "研究聚焦医学影像自监督学习、眼底疾病智能诊断、压电触摸力感知与可穿戴健康系统，连接视觉模型、传感信号建模与真实场景中的健康评估。",
      affiliationLabel: "当前单位",
      affiliations: [
        { name: "陆空基信息感知与控制全国重点实验室", location: "陕西西安 710065" },
        { name: "西安现代控制技术研究所", location: "陕西西安 710065" }
      ],
      coverFigureAlt: "多眼底疾病自监督学习论文原图",
      coverFigureCaption: "自监督学习用于多种眼底疾病诊断",
      sections: {
        focus: {
          kicker: "Research focus",
          title: "三条研究线，一条从信号到健康判断的证据链",
          intro: "围绕有限标签医学图像、压电触摸信号和可穿戴健康数据，关注模型在真实评估场景中的可靠性与可迁移性。"
        },
        publications: {
          kicker: "Publications",
          title: "医学视觉、触觉感知与健康评估",
          intro: "论文与会议成果覆盖医学影像、自监督学习、压电触摸力感知、可穿戴传感和康复评估。"
        },
        patents: {
          kicker: "Patents",
          title: "从研究方法到可落地系统的技术登记",
          intro: "专利围绕智能触摸交互、可穿戴健康风险评估、肌力检测与儿童身体机能发育评估展开。"
        },
        profile: {
          kicker: "Profile",
          title: "教育、工作与那些构成训练底色的细节",
          intro: "本科与硕士阶段均就读于北京航空航天大学，毕业后进入实验室与研究所工作。"
        }
      },
      researchTracks: [
        {
          title: "眼底医学影像 AI",
          text: "利用自监督视觉模型从少标签眼底图像中学习可复用表征，服务多疾病筛查、风险预测和跨来源泛化。",
          keywords: "Self-supervised vision / Fundus images / Multi-disease diagnosis"
        },
        {
          title: "压电触摸力感知",
          text: "围绕压电触摸屏信号的长期稳定、力级分类和交互显示，提升低数据量场景下的识别可靠性。",
          keywords: "Piezoelectric sensing / Force classification / Interactive displays"
        },
        {
          title: "可穿戴健康与评估",
          text: "结合传感器、模型和人机系统，面向近视风险、步态康复、儿童身体机能发育等健康评估问题。",
          keywords: "Wearable health / Rehabilitation / Risk assessment"
        }
      ],
      timelineAria: "教育与工作经历",
      timeline: [
        { label: "本科", title: "北京航空航天大学", text: "" },
        { label: "硕士", title: "北京航空航天大学", text: "研究方向覆盖医学影像 AI、智能传感与健康评估。" },
        { label: "毕业后", title: "进入实验室工作", text: "陆空基信息感知与控制全国重点实验室、西安现代控制技术研究所。" }
      ],
      coursesLabel: "Full-score courses",
      coursesTitle: "满分课程",
      coursesSource: "满分课程：工科数学分析、线性代数、复变函数、概率统计、电路分析、大学物理。",
      courses: ["工科数学分析", "线性代数", "复变函数", "概率统计", "电路分析", "大学物理"],
      honorsLabel: "Recognition",
      honorsTitle: "Honors",
      honors: ["北京市工程设计表达竞赛一等奖", "北航优秀研究生", "北航优秀毕业生", "北航优秀学生干部", "北航优秀生", "北航三好学生"],
      patentLabels: { number: "编号", role: "角色" },
      contactKicker: "Contact",
      contactTitle: "让研究继续发生。",
      worldFooter: "个人天地",
      updated: "更新日期：2026-07-10",
      closeFigure: "关闭图片"
    },
    en: {
      title: "Yong Liu / 刘勇 - Academic Homepage",
      description: "Academic homepage of Yong Liu, featuring publications and patents in self-supervised medical imaging, piezoelectric force sensing, wearable health, and intelligent systems.",
      skip: "Skip to content",
      headerHome: "Back to top",
      headerSubtitle: "Research folio",
      controlsLabel: "Display controls",
      themeLabel: "Select visual style",
      languageLabel: "Language",
      worldAria: "Back to personal world",
      world: "World",
      nav: ["Research", "Publications", "Patents", "Profile", "Contact"],
      mobileNav: [
        { label: "Top", aria: "Cover" },
        { label: "R&D", aria: "Research focus" },
        { label: "Pub", aria: "Publications" },
        { label: "Pat", aria: "Patents" },
        { label: "CV", aria: "Profile" }
      ],
      coverEdition: "Research folio",
      coverKicker: "Medical vision · Intelligent sensing · Health systems",
      namePrimary: "Yong Liu",
      nameSecondary: "刘勇",
      coverLede: "Research at the intersection of self-supervised medical imaging, intelligent fundus diagnosis, piezoelectric force sensing, and wearable health systems, connecting visual models and sensor-signal modeling with reliable real-world assessment.",
      affiliationLabel: "Current affiliation",
      affiliations: [
        { name: "National Key Laboratory of Land and Air Based Information Perception and Control", location: "Xi’an 710065, Shaanxi, China" },
        { name: "Xi’an Modern Control Technology Research Institute", location: "Xi’an 710065, Shaanxi, China" }
      ],
      coverFigureAlt: "Original figure from the self-supervised multiple fundus disorders paper",
      coverFigureCaption: "Self-supervised diagnosis of multiple fundus disorders",
      sections: {
        focus: {
          kicker: "Research focus",
          title: "Three research lines, one evidence chain from signals to health decisions",
          intro: "The work spans limited-label medical images, piezoelectric touch signals, and wearable health data, with emphasis on reliability and transferability in practical assessment."
        },
        publications: {
          kicker: "Publications",
          title: "Medical Vision, Tactile Sensing, and Health Assessment",
          intro: "Journal and conference work covers medical imaging, self-supervised learning, piezoelectric force sensing, wearable sensing, and rehabilitation assessment."
        },
        patents: {
          kicker: "Patents",
          title: "A technical register from research methods to working systems",
          intro: "Patent work addresses intelligent touch interaction, wearable health-risk assessment, muscle-force detection, and children’s physical-function development."
        },
        profile: {
          kicker: "Profile",
          title: "Education, work, and the details behind the training",
          intro: "Undergraduate and master’s study at Beihang University, followed by work at the laboratory and research institute."
        }
      },
      researchTracks: [
        {
          title: "Fundus Medical Imaging AI",
          text: "Self-supervised visual models learn reusable representations from limited-label fundus images for multi-disease screening, risk prediction, and cross-source generalization.",
          keywords: "Self-supervised vision / Fundus images / Multi-disease diagnosis"
        },
        {
          title: "Piezoelectric Force Sensing",
          text: "Machine-learning methods improve long-term stability, force-level classification, and interaction reliability for piezoelectric touch signals under limited data.",
          keywords: "Piezoelectric sensing / Force classification / Interactive displays"
        },
        {
          title: "Wearable Health Assessment",
          text: "Sensor, model, and human-system research supports myopia risk, gait rehabilitation, and children’s physical-function development assessment.",
          keywords: "Wearable health / Rehabilitation / Risk assessment"
        }
      ],
      timelineAria: "Education and work experience",
      timeline: [
        { label: "Undergraduate", title: "Beihang University", text: "" },
        { label: "Master’s", title: "Beihang University", text: "Research across medical imaging AI, intelligent sensing, and health assessment." },
        { label: "After graduation", title: "Research laboratory", text: "National Key Laboratory of Land and Air Based Information Perception and Control; Xi’an Modern Control Technology Research Institute." }
      ],
      coursesLabel: "Full-score courses",
      coursesTitle: "Full-score courses",
      coursesSource: "Full-score courses: Engineering Mathematical Analysis, Linear Algebra, Complex Variables, Probability and Statistics, Circuit Analysis, and College Physics.",
      courses: ["Engineering Mathematical Analysis", "Linear Algebra", "Complex Variables", "Probability and Statistics", "Circuit Analysis", "College Physics"],
      honorsLabel: "Recognition",
      honorsTitle: "Honors",
      honors: ["First Prize, Beijing Engineering Design Expression Competition", "Outstanding Graduate Student, Beihang University", "Outstanding Graduate, Beihang University", "Outstanding Student Cadre, Beihang University", "Outstanding Student, Beihang University", "Merit Student, Beihang University"],
      patentLabels: { number: "No.", role: "Role" },
      contactKicker: "Contact",
      contactTitle: "Keep the research moving.",
      worldFooter: "Personal world",
      updated: "Last updated: 2026-07-10",
      closeFigure: "Close figure"
    }
  };

  const publications = [
    {
      title: "Rectified Artificial Neural Networks for Long-Term Force Sensing in Piezoelectric Touch Panels",
      status: "Published",
      statusClass: "published",
      venue: "Electronics, 14(10), 2081",
      year: "2025",
      authors: ["Yong Liu", "Xuemeng Li", "Weihao Ma", "Hongbei Meng", "Shuo Gao"],
      summaryZh: "提出面向压电触摸屏长期力感知的修正神经网络方法，针对长期使用和响应漂移导致的识别不稳定问题，提升触摸力估计与分类的可靠性。",
      summaryEn: "Rectified neural models improve long-term piezoelectric force sensing under response drift and device variation.",
      image: "assets/papers/rectified-ann.jpg",
      figureFormat: "portrait",
      imageAltZh: "修正人工神经网络压电触摸力感知论文原图",
      imageAltEn: "Original figure from the rectified artificial neural network force-sensing paper",
      links: [
        { label: "DOI", url: "https://doi.org/10.3390/electronics14102081" },
        { label: "Publisher", url: "https://www.mdpi.com/2079-9292/14/10/2081" },
        { label: "Preprint", url: "https://doi.org/10.21203/rs.3.rs-3115583/v1" }
      ]
    },
    {
      title: "Diagnosis of Multiple Fundus Disorders Amidst a Scarcity of Medical Experts Via Self-Supervised Machine Learning",
      status: "Published",
      statusClass: "published",
      venue: "IEEE Internet of Things Journal",
      year: "2025",
      authors: ["Yong Liu", "Mengtian Kang", "Shuo Gao", "Chi Zhang", "Ying Liu", "Shiming Li", "Yue Qi", "Arokia Nathan", "Wenjun Xu", "Chenyu Tang", "Edoardo Occhipinti", "Mayinuer Yusufu", "Ningli Wang", "Weiling Bai", "Luigi Occhipinti"],
      summaryZh: "面向眼底专科医生稀缺与标签数据有限的问题，利用自监督机器学习建立多眼底疾病诊断框架，强调跨人群、跨图像来源的可迁移诊断能力。",
      summaryEn: "Self-supervised fundus representation learning supports multi-disorder diagnosis when expert annotation is scarce.",
      image: "assets/papers/fundus-disorders.png",
      figureFormat: "portrait",
      imageAltZh: "多眼底疾病自监督机器学习诊断论文原图",
      imageAltEn: "Original figure from the multiple fundus disorders self-supervised learning paper",
      links: [
        { label: "DOI", url: "https://doi.org/10.1109/JIOT.2024.3463185" },
        { label: "IEEE Xplore", url: "https://ieeexplore.ieee.org/document/10684157/" }
      ]
    },
    {
      title: "SSVT: Self-Supervised Vision Transformer For Eye Disease Diagnosis Based On Fundus Images",
      status: "Conference",
      statusClass: "conference",
      venue: "IEEE ISBI 2024",
      year: "2024",
      authors: ["Jiaqi Wang", "Mengtian Kang", "Yong Liu", "Chi Zhang", "Ying Liu", "Shiming Li", "Yue Qi", "Wenjun Xu", "Chenyu Tang", "Edoardo Occhipinti", "Mayinuer Yusufu", "Ningli Wang", "Weiling Bai", "Shuo Gao", "Luigi G. Occhipinti"],
      summaryZh: "构建面向眼底疾病诊断的自监督视觉 Transformer，利用无标签或弱标签图像学习眼底语义表征，为后续多疾病识别提供基础模型能力。",
      summaryEn: "A self-supervised vision transformer learns fundus representations for downstream eye disease diagnosis.",
      image: "assets/papers/ssvt.png",
      figureFormat: "standard",
      imageAltZh: "SSVT 眼底图像疾病诊断论文原图",
      imageAltEn: "Original figure from the SSVT fundus image diagnosis paper",
      links: [
        { label: "DOI", url: "https://doi.org/10.1109/ISBI56570.2024.10635531" },
        { label: "IEEE Xplore", url: "https://ieeexplore.ieee.org/document/10635531/" },
        { label: "arXiv", url: "https://doi.org/10.48550/arXiv.2404.13386" }
      ]
    },
    {
      title: "Multimodal Sensing in Stroke Motor Rehabilitation",
      status: "Published Review",
      statusClass: "published",
      venue: "Advanced Sensor Research, 2(9), 2200055",
      year: "2023",
      authors: ["Zihe Zhao", "Jiaqi Wang", "Shengbo Wang", "Rui Wang", "Yao Lu", "Yan Yuan", "Junliang Chen", "Yanning Dai", "Yong Liu", "Xiaomeng Wang", "Yu Pan", "Shuo Gao"],
      summaryZh: "综述脑卒中运动康复中的多模态传感技术，覆盖可穿戴传感、运动信号采集、康复评估与智能反馈系统，为智慧医疗辅助诊断系统提供技术背景。",
      summaryEn: "A review of multimodal sensing technologies for post-stroke motor rehabilitation, assessment, and feedback systems.",
      image: "assets/papers/multimodal-stroke.jpg",
      figureFormat: "standard",
      imageAltZh: "脑卒中运动康复多模态传感综述图形摘要",
      imageAltEn: "Graphical abstract from the multimodal sensing in stroke motor rehabilitation review",
      links: [
        { label: "DOI", url: "https://doi.org/10.1002/adsr.202200055" },
        { label: "Publisher", url: "https://advanced.onlinelibrary.wiley.com/doi/10.1002/adsr.202200055" }
      ]
    },
    {
      title: "Force Touch and Machine Learning Based Smart Sensing Techniques for Interactive Displays",
      status: "Invited Paper",
      statusClass: "conference",
      venue: "SID Symposium Digest of Technical Papers, 52(S1), 26-29",
      year: "2021",
      authors: ["Shuo Gao", "Yanning Dai", "Junliang Chen", "Anbiao Huang", "Yong Liu"],
      summaryZh: "围绕交互显示中的力触控功能，讨论压电力感知与机器学习在智能显示交互中的应用，是触摸力识别研究线的显示技术扩展。",
      summaryEn: "An invited overview of force touch and machine-learning sensing techniques for interactive displays.",
      image: "assets/papers/force-touch.png",
      figureFormat: "wide",
      imageAltZh: "交互显示压电力触控研究流程原图",
      imageAltEn: "Original force-touch preprocessing figure from the piezoelectric sensing research line",
      links: [
        { label: "DOI", url: "https://doi.org/10.1002/sdtp.14367" },
        { label: "Publisher", url: "https://sid.onlinelibrary.wiley.com/doi/10.1002/sdtp.14367" }
      ]
    },
    {
      title: "Ensemble Learning-Based Technique for Force Classifications in Piezoelectric Touch Panels",
      status: "Published",
      statusClass: "published",
      venue: "IEEE Sensors Journal, 20(18), 10927-10934",
      year: "2020",
      authors: ["Yong Liu", "Shuo Gao", "Anbiao Huang", "Jie Zhu", "Lijun Xu", "Arokia Nathan"],
      summaryZh: "针对压电触摸屏中力电压响应不均一、少量数据下分类精度不足等问题，提出集成学习力级分类方法，实现多触摸力等级的高精度识别。",
      summaryEn: "An ensemble learning method improves force-level classification in piezoelectric touch panels under limited data.",
      image: "assets/papers/ensemble-force.png",
      figureFormat: "wide",
      imageAltZh: "压电触摸屏集成学习力度分类论文原图",
      imageAltEn: "Original force classification network figure from the piezoelectric sensing paper",
      links: [
        { label: "DOI", url: "https://doi.org/10.1109/JSEN.2020.2987768" },
        { label: "IEEE Xplore", url: "https://ieeexplore.ieee.org/document/9064844/" }
      ]
    }
  ];

  const patents = [
    {
      title: "触摸力度识别方法及其模型的训练方法、装置和电子系统",
      titleEn: "Touch Force Recognition Method, Model Training Method, Apparatus, and Electronic System",
      status: "Granted / 已授权",
      statusClass: "published",
      numbers: "CN111061394A / CN111061394B",
      role: "学生一作；压电触摸力识别相关",
      roleEn: "Student first author; related to piezoelectric touch-force recognition",
      summary: "围绕触摸力度识别模型训练、装置与电子系统，支撑压电触摸屏力级分类研究成果转化。",
      summaryEn: "Covers model training, apparatus, and electronic-system implementation for touch-force recognition, supporting translation of piezoelectric touch-panel force classification research.",
      links: [
        { label: "CN111061394B", url: "https://patents.google.com/patent/CN111061394B/zh" },
        { label: "CN111061394A", url: "https://patents.google.com/patent/CN111061394A/zh" }
      ]
    },
    {
      title: "近视风险评估方法、装置及穿戴设备",
      titleEn: "Myopia Risk Assessment Method, Apparatus, and Wearable Device",
      status: "Granted / 已授权",
      statusClass: "published",
      numbers: "CN115137314A / CN115137314B",
      role: "学生一作；可穿戴近视风险评估相关",
      roleEn: "Student first author; related to wearable myopia-risk assessment",
      summary: "面向儿童/青少年近视风险评估，将眼部或行为相关数据转化为风险指标并结合穿戴设备实现评估。",
      summaryEn: "Transforms eye- or behavior-related data into risk indicators for children and adolescents, with assessment implemented through wearable devices.",
      links: [
        { label: "CN115137314B", url: "https://patents.google.com/patent/CN115137314B/zh" },
        { label: "CN115137314A", url: "https://patents.google.com/patent/CN115137314A/zh" }
      ]
    },
    {
      title: "一种基于肌力检测的手部动作识别方法及其模型的训练方法、装置和电子系统",
      titleEn: "Hand Gesture Recognition Method Based on Muscle Force Detection, Model Training Method, Apparatus, and Electronic System",
      status: "Published / 已公开",
      statusClass: "conference",
      numbers: "CN115905803A",
      role: "学生一作；肌力检测与动作识别相关",
      roleEn: "Student first author; related to muscle-force detection and gesture recognition",
      summary: "利用肌力检测信息训练手部动作识别模型，关联可穿戴传感、动作识别和辅助康复场景。",
      summaryEn: "Uses muscle-force detection information to train hand gesture-recognition models for wearable sensing, motion recognition, and assistive rehabilitation scenarios.",
      links: [
        { label: "CN115905803A", url: "https://patents.google.com/patent/CN115905803A/zh" }
      ]
    },
    {
      title: "一种儿童身体机能发育评估系统及其评估模型的训练方法",
      titleEn: "Children's Physical Function Development Assessment System and Model Training Method",
      status: "Filed / 已受理",
      statusClass: "review",
      numbers: "公开编号待更新",
      role: "学生一作；儿童身体机能发育评估相关",
      roleEn: "Student first author; related to children's physical-function development assessment",
      summary: "面向儿童身体机能发育状态评估，结合评估系统和模型训练方法。",
      summaryEn: "Combines an assessment system and model-training method for evaluating children's physical-function development status.",
      links: []
    }
  ];

  const statusText = {
    zh: {
      "Published": "已发表",
      "Conference": "会议论文",
      "Published Review": "已发表综述",
      "Invited Paper": "特邀论文",
      "Granted / 已授权": "已授权",
      "Published / 已公开": "已公开",
      "Filed / 已受理": "已受理"
    },
    en: {
      "Published": "Published",
      "Conference": "Conference",
      "Published Review": "Published Review",
      "Invited Paper": "Invited Paper",
      "Granted / 已授权": "Granted",
      "Published / 已公开": "Published",
      "Filed / 已受理": "Filed"
    }
  };

  const storageKeys = {
    theme: "homepage-theme-v3",
    lang: "homepage-language-v3"
  };

  let currentTheme = readPreference(storageKeys.theme, "classic");
  let currentLanguage = readPreference(storageKeys.lang, "zh");
  let progressFrame = 0;
  let revealObserver = null;

  if (!themeLabels[currentTheme]) currentTheme = "classic";
  if (!uiText[currentLanguage]) currentLanguage = "zh";

  function readPreference(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writePreference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      return false;
    }
    return true;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderAuthors(authors) {
    return authors.map((author) => {
      const name = escapeHtml(author);
      return author === "Yong Liu" ? `<strong>${name}</strong>` : name;
    }).join(", ");
  }

  function renderLinks(links) {
    return links.map((link) => (
      `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`
    )).join("");
  }

  function renderPublications() {
    const list = document.getElementById("publication-list");
    if (!list) return;

    list.innerHTML = publications.map((item, index) => {
      const number = String(index + 1).padStart(2, "0");
      const summary = currentLanguage === "en" ? item.summaryEn : item.summaryZh;
      const imageAlt = currentLanguage === "en" ? item.imageAltEn : item.imageAltZh;
      const status = statusText[currentLanguage][item.status] || item.status;

      return `
        <article class="publication-spread reveal-block" data-publication-index="${number}">
          <div class="publication-index" aria-hidden="true">${number}</div>
          <figure class="publication-figure">
            <button class="figure-trigger" type="button" data-figure-src="${escapeHtml(item.image)}" data-figure-caption="${escapeHtml(item.title)}">
              <span class="figure-frame figure-${escapeHtml(item.figureFormat)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(imageAlt)}" loading="lazy"></span>
              <span class="zoom-mark" aria-hidden="true">+</span>
            </button>
            <figcaption><span>${escapeHtml(item.venue)}</span><span>${escapeHtml(item.year)}</span></figcaption>
          </figure>
          <div class="publication-copy">
            <div class="publication-meta">
              <span class="publication-status ${escapeHtml(item.statusClass)}">${escapeHtml(status)}</span>
              <span>${escapeHtml(item.year)}</span>
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="publication-authors">${renderAuthors(item.authors)}</p>
            <p class="publication-summary">${escapeHtml(summary)}</p>
            <div class="record-links">${renderLinks(item.links)}</div>
          </div>
        </article>`;
    }).join("");

    observeRevealBlocks();
  }

  function renderPatents() {
    const list = document.getElementById("patent-list");
    if (!list) return;
    const labels = uiText[currentLanguage].patentLabels;

    list.innerHTML = patents.map((item, index) => {
      const number = String(index + 1).padStart(2, "0");
      const title = currentLanguage === "en" ? item.titleEn : item.title;
      const role = currentLanguage === "en" ? item.roleEn : item.role;
      const summary = currentLanguage === "en" ? item.summaryEn : item.summary;
      const patentNumber = currentLanguage === "en" && item.numbers === "公开编号待更新" ? "Publication number pending" : item.numbers;
      const status = statusText[currentLanguage][item.status] || item.status;

      return `
        <article class="patent-entry reveal-block" data-patent-index="${number}">
          <div class="patent-index" aria-hidden="true">P.${number}</div>
          <div class="patent-status ${escapeHtml(item.statusClass)}">${escapeHtml(status)}</div>
          <div class="patent-copy">
            <h3>${escapeHtml(title)}</h3>
            <div class="patent-facts">
              <p><span>${escapeHtml(labels.number)}</span>${escapeHtml(patentNumber)}</p>
              <p><span>${escapeHtml(labels.role)}</span>${escapeHtml(role)}</p>
            </div>
            <p class="patent-summary">${escapeHtml(summary)}</p>
          </div>
          <div class="record-links">${renderLinks(item.links)}</div>
        </article>`;
    }).join("");

    observeRevealBlocks();
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function setList(selector, values) {
    const element = document.querySelector(selector);
    if (element) element.innerHTML = values.map((value) => `<li>${escapeHtml(value)}</li>`).join("");
  }

  function applyTheme(theme) {
    if (!themeLabels[theme]) return;
    currentTheme = theme;
    document.body.dataset.theme = theme;
    const select = document.getElementById("theme-select");
    if (select) select.value = theme;
    writePreference(storageKeys.theme, theme);
  }

  function applyLanguage(language) {
    if (!uiText[language]) return;
    currentLanguage = language;
    const text = uiText[language];
    const htmlLanguage = language === "zh" ? "zh-CN" : "en";

    document.documentElement.lang = htmlLanguage;
    document.body.dataset.language = language;
    document.title = text.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", text.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", text.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", text.description);

    setText(".skip-link", text.skip);
    document.querySelector(".identity-stamp")?.setAttribute("aria-label", text.headerHome);
    setText(".stamp-copy small", text.headerSubtitle);
    document.querySelector(".display-controls")?.setAttribute("aria-label", text.controlsLabel);
    document.getElementById("theme-select")?.setAttribute("aria-label", text.themeLabel);
    document.querySelector(".theme-control .sr-only")?.replaceChildren(text.themeLabel);
    document.querySelector(".lang-toggle")?.setAttribute("aria-label", text.languageLabel);
    document.querySelector(".world-button")?.setAttribute("aria-label", text.worldAria);
    setText(".world-label", text.world);

    document.querySelectorAll("#theme-select option").forEach((option) => {
      option.textContent = themeLabels[option.value]?.[language] || option.value;
    });

    document.querySelectorAll(".desktop-nav a").forEach((link, index) => {
      if (text.nav[index]) link.textContent = text.nav[index];
    });

    document.querySelectorAll(".mobile-progress a").forEach((link, index) => {
      const label = text.mobileNav[index];
      if (!label) return;
      link.setAttribute("aria-label", label.aria);
      const visible = link.querySelector(".progress-label");
      if (visible) visible.textContent = label.label;
    });

    setText(".cover-edition-label", text.coverEdition);
    setText(".cover-kicker", text.coverKicker);
    setText(".name-primary", text.namePrimary);
    setText(".name-secondary", text.nameSecondary);
    setText(".cover-lede", text.coverLede);
    setText(".credit-label", text.affiliationLabel);

    document.querySelectorAll(".affiliation-list li").forEach((item, index) => {
      const affiliation = text.affiliations[index];
      if (!affiliation) return;
      setTextWithin(item, "strong", affiliation.name);
      setTextWithin(item, "span", affiliation.location);
    });

    const coverImage = document.querySelector(".evidence-plate img");
    if (coverImage) coverImage.alt = text.coverFigureAlt;
    const coverTrigger = document.querySelector(".evidence-plate .figure-trigger");
    if (coverTrigger) coverTrigger.dataset.figureCaption = text.coverFigureCaption;
    setText(".evidence-plate .plate-caption", text.coverFigureCaption);

    for (const id of ["focus", "publications", "patents", "profile"]) {
      const section = document.getElementById(id);
      const sectionText = text.sections[id];
      if (!section || !sectionText) continue;
      setTextWithin(section, ".chapter-kicker", sectionText.kicker);
      setTextWithin(section, ".chapter-title-block h2", sectionText.title);
      setTextWithin(section, ".chapter-intro", sectionText.intro);
    }

    document.querySelectorAll(".research-track").forEach((track, index) => {
      const item = text.researchTracks[index];
      if (!item) return;
      setTextWithin(track, "h3", item.title);
      setTextWithin(track, ".track-copy p", item.text);
      setTextWithin(track, ".track-keywords", item.keywords);
    });

    const timeline = document.querySelector(".profile-timeline");
    if (timeline) timeline.setAttribute("aria-label", text.timelineAria);
    document.querySelectorAll(".timeline-entry").forEach((entry, index) => {
      const item = text.timeline[index];
      if (!item) return;
      setTextWithin(entry, ".timeline-label", item.label);
      setTextWithin(entry, "h3", item.title);
      let description = entry.querySelector("h3 + p");
      if (item.text && !description) {
        description = document.createElement("p");
        entry.append(description);
      }
      if (description) {
        description.textContent = item.text;
        description.hidden = !item.text;
      }
    });

    setText(".course-field .profile-label", text.coursesLabel);
    setText("#courses-title", text.coursesTitle);
    setText(".course-source", text.coursesSource);
    setList(".course-matrix", text.courses);
    setText(".honor-field .profile-label", text.honorsLabel);
    setText("#honors-title", text.honorsTitle);
    setList(".honor-list", text.honors);

    setText(".contact-kicker", text.contactKicker);
    setText(".contact-close h2", text.contactTitle);
    const footerLinks = document.querySelectorAll(".contact-meta div a");
    if (footerLinks[2]) footerLinks[2].textContent = text.worldFooter;
    setText(".update-line", text.updated);
    document.querySelector(".dialog-close")?.setAttribute("aria-label", text.closeFigure);

    document.querySelectorAll(".lang-toggle button").forEach((button) => {
      const active = button.dataset.lang === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    writePreference(storageKeys.lang, language);
    renderPublications();
    renderPatents();
    requestSectionProgressUpdate();
  }

  function setTextWithin(container, selector, value) {
    const element = container.querySelector(selector);
    if (element) element.textContent = value;
  }

  function updateSectionProgress() {
    const links = Array.from(document.querySelectorAll(".mobile-progress a"));
    const marker = window.scrollY + window.innerHeight * 0.38;
    let activeIndex = 0;

    links.forEach((link, index) => {
      const target = document.getElementById(link.dataset.sectionTarget);
      if (target && target.offsetTop <= marker) activeIndex = index;
    });

    links.forEach((link, index) => {
      const active = index === activeIndex;
      link.classList.toggle("is-active", active);
      link.classList.toggle("is-past", index < activeIndex);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });

    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maximum > 0 ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
    document.documentElement.style.setProperty("--page-progress", String(ratio));
    progressFrame = 0;
  }

  function requestSectionProgressUpdate() {
    if (progressFrame) return;
    progressFrame = window.requestAnimationFrame(updateSectionProgress);
  }

  function observeRevealBlocks() {
    const blocks = document.querySelectorAll(".reveal-block:not(.is-visible)");
    if (!blocks.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      blocks.forEach((block) => block.classList.add("is-visible"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }

    blocks.forEach((block) => revealObserver.observe(block));
  }

  function openFigure(trigger) {
    const dialog = document.getElementById("figure-dialog");
    if (!dialog) return;
    const image = dialog.querySelector("img");
    const caption = dialog.querySelector("#figure-dialog-caption");
    const sourceImage = trigger.querySelector("img");
    if (image) {
      image.src = trigger.dataset.figureSrc || sourceImage?.src || "";
      image.alt = sourceImage?.alt || trigger.dataset.figureCaption || "";
    }
    if (caption) caption.textContent = trigger.dataset.figureCaption || sourceImage?.alt || "";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".figure-trigger");
    if (trigger) openFigure(trigger);
  });

  const figureDialog = document.getElementById("figure-dialog");
  figureDialog?.addEventListener("click", (event) => {
    if (event.target === figureDialog) figureDialog.close();
  });

  document.getElementById("theme-select")?.addEventListener("change", (event) => {
    applyTheme(event.target.value);
  });

  document.querySelectorAll(".lang-toggle button").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
  });

  window.addEventListener("scroll", requestSectionProgressUpdate, { passive: true });
  window.addEventListener("resize", requestSectionProgressUpdate);

  applyTheme(currentTheme);
  applyLanguage(currentLanguage);
  observeRevealBlocks();
  updateSectionProgress();
})();
