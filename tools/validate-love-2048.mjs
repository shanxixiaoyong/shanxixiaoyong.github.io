import { readFileSync } from "node:fs";

const files = {
  html: readFileSync("game-2048.html", "utf8"),
  js: readFileSync("assets/games.js", "utf8"),
  css: readFileSync("assets/world.css", "utf8"),
  siteValidator: readFileSync("tools/validate-site.mjs", "utf8")
};

const expectations = [
  ["HTML page title is romantic 2048", files.html, "桃花心动 2048"],
  ["HTML page description matches love theme", files.html, "爱心、情侣、桃花"],
  ["Game registry uses love theme id", files.js, 'theme: "love-2048"'],
  ["Game registry uses love board class", files.js, 'boardClass: "board-love-2048"'],
  ["2048 state tracks affinity", files.js, "let affinity = 0"],
  ["2048 state tracks bloom chain", files.js, "let bloomChain = 0"],
  ["2048 state tracks vow readiness", files.js, "let vowReady = false"],
  ["2048 tracks last merge cells", files.js, "lastMergeCells"],
  ["2048 records move direction", files.js, "lastMoveDir"],
  ["2048 emits love merge effect", files.js, 'triggerBoardEffect("love-merge"'],
  ["2048 emits vow effect", files.js, 'triggerBoardEffect("love-vow"'],
  ["2048 renders tile romance labels", files.js, "romanceTile"],
  ["2048 renders collision class", files.js, "is-collision"],
  ["2048 status uses affinity copy", files.js, "心动值"],
  ["CSS defines love theme tokens", files.css, ".love-2048"],
  ["CSS defines love board", files.css, ".board-love-2048"],
  ["CSS defines heart tile shape", files.css, ".board-love-2048 .merge-cell::before"],
  ["CSS defines petal layer", files.css, ".board-love-2048::before"],
  ["CSS defines merge burst", files.css, ".effect-love-merge"],
  ["CSS defines vow burst", files.css, ".effect-love-vow"],
  ["CSS defines collision animation", files.css, ".board-love-2048 .merge-cell.is-collision"],
  ["CSS defines love motion keyframes", files.css, "@keyframes loveMergePulse"],
  ["Site validator tracks love theme", files.siteValidator, 'theme: "love-2048"'],
  ["Site validator tracks love board", files.siteValidator, 'board: "board-love-2048"']
];

const failures = expectations.filter(([, source, needle]) => !source.includes(needle));

if (failures.length) {
  console.error("Love 2048 validation failed:");
  for (const [label, , needle] of failures) {
    console.error(`- ${label}: missing ${JSON.stringify(needle)}`);
  }
  process.exit(1);
}

console.log("Love 2048 validation passed");
