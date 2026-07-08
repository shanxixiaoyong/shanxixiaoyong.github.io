import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const vault = process.argv[2] || process.env.OBSIDIAN_VAULT;
const output = process.argv[3] || "data/knowledge.json";

if (!vault) {
  console.error("Usage: node tools/sync-obsidian.mjs /path/to/obsidian-vault [data/knowledge.json]");
  process.exit(1);
}

if (!existsSync(vault)) {
  console.error(`Vault path not found: ${vault}`);
  process.exit(1);
}

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) entries.push(...walk(path));
    else if (stat.isFile() && extname(name).toLowerCase() === ".md") entries.push(path);
  }
  return entries;
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return [{}, raw];
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return [{}, raw];
  const block = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trim();
  const data = {};
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((item) => item.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    data[key] = value;
  }
  return [data, body];
}

function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupFromPath(path, text) {
  const value = `${path} ${text}`.toLowerCase();
  if (/paper|writing|写作|论文|投稿|rebuttal/.test(value)) return "writing";
  if (/read|reading|文献|阅读|survey|综述/.test(value)) return "reading";
  if (/method|experiment|code|工程|实验|方法|复现/.test(value)) return "method";
  return "research";
}

function isPublicNote(note) {
  const type = String(note.type || "");
  const path = String(note.path || "");
  const haystack = `${note.title || ""} ${type} ${note.source || ""} ${path} ${note.excerpt || ""}`.toLowerCase();

  if (/^source[\s-]?(note|index)$/i.test(type)) return false;
  if (/^(00-home|40-tools-and-automations|90-sources|_templates)(\/|$)/i.test(path)) return false;
  if (/codex|chatgpt|personal academic homepage|yong liu academic homepage|github pages|template|software unit|peach blossom|welcome home|automation 4 memory/.test(haystack)) return false;
  if (/implementation plan|requirements?|需求|要求|实现计划|实现规格/.test(haystack)) return false;

  return true;
}

const notes = walk(vault)
  .map((file) => {
    const raw = readFileSync(file, "utf8");
    const [frontmatter, body] = parseFrontmatter(raw);
    const rel = relative(vault, file);
    const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const text = plainText(body);
    const tags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags
      : String(frontmatter.tags || "")
          .split(/[,\s]+/)
          .map((item) => item.replace(/^#/, "").trim())
          .filter(Boolean);
    return {
      title: frontmatter.title || heading || basename(file, ".md"),
      group: frontmatter.group || groupFromPath(rel, `${heading || ""} ${tags.join(" ")}`),
      type: frontmatter.type || "Obsidian Note",
      source: rel.split("/").slice(0, -1).join("/") || "Vault",
      excerpt: frontmatter.excerpt || text.slice(0, 150),
      tags: tags.slice(0, 6),
      updated: frontmatter.updated || statSync(file).mtime.toISOString().slice(0, 10),
      path: rel
    };
  })
  .filter((note) => note.excerpt)
  .filter(isPublicNote)
  .sort((a, b) => String(b.updated).localeCompare(String(a.updated)));

mkdirSync(output.split("/").slice(0, -1).join("/") || ".", { recursive: true });
writeFileSync(output, `${JSON.stringify(notes, null, 2)}\n`);
console.log(`Exported ${notes.length} notes to ${output}`);
