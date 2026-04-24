import type { Root } from 'mdast';
import type { VFile } from 'vfile';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

const parser = unified().use(remarkParse);

export default function remarkExternalSource() {
  return async (tree: Root, vfile: VFile) => {
    const fm = (vfile.data as any).astro?.frontmatter;
    if (!fm?.source?.repo || !fm?.source?.path) return;

    const branch = fm.source.branch ?? 'main';
    const url = `https://raw.githubusercontent.com/${fm.source.repo}/${branch}/${fm.source.path}`;

    const headers: Record<string, string> = {};
    const token = process.env.SOURCE_REPO_TOKEN;
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    let text: string;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      text = await res.text();
    } catch (err) {
      throw new Error(
        `[remark-external-source] failed to fetch ${url}: ${err}`,
      );
    }

    const body = text.replace(/^#[^\n]+\n\n(---\n\n)?/, '');
    const parsed = parser.parse(body);
    tree.children = parsed.children as Root['children'];
  };
}
