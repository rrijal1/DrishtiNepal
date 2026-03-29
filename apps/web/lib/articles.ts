import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';

const postsDirectory = path.join(process.cwd(), 'content/articles');

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

export async function getPostData(slug: string) {
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
    ...matterResult.data,
  };
}
