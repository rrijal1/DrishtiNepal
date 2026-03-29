import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';

// Resolve directory relative to the process cwd, which is the package dir in dev/prod
// but might be the project root in some build environments.
const findPostsDirectory = () => {
  const rootDir = process.cwd();
  const localDir = path.join(rootDir, 'content/articles');
  if (fs.existsSync(localDir)) return localDir;
  
  // Try going up to project root if in apps/web
  const monorepoDir = path.join(rootDir, '../../content/articles');
  if (fs.existsSync(monorepoDir)) return monorepoDir;
  
  return localDir; // fallback
};

export const postsDirectory = findPostsDirectory();

export interface PostData {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  [key: string]: any;
}

export function getSortedPostsData(): PostData[] {
  // Get file names under /content/articles
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get slug
    const slug = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    // Combine the data with the slug
    return {
      slug,
      title: matterResult.data.title,
      date: matterResult.data.date,
      author: matterResult.data.author,
      excerpt: matterResult.data.excerpt,
      ...matterResult.data,
    };
  });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    return {
      slug: fileName.replace(/\.md$/, ''),
    };
  });
}

export async function getPostData(slug: string): Promise<PostData & { content: any }> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Use next-mdx-remote to compile the mdx
  const { content } = await compileMDX({
    source: matterResult.content,
    options: { parseFrontmatter: false },
  });

  // Combine the data with the slug and content
  return {
    slug,
    content,
    title: matterResult.data.title,
    date: matterResult.data.date,
    author: matterResult.data.author,
    excerpt: matterResult.data.excerpt,
    ...matterResult.data,
  } as PostData & { content: any };
}
