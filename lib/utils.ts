import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Octokit } from "@octokit/rest";

type GenerateReadmeRequest = {
  input: string; // optional if repo is provided
  repoUrl?: string; // e.g., https://github.com/vercel/next.js
  useGemini?: boolean;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export function parseGitHubUrl(repoUrl: string) {
  try {
    const url = new URL(repoUrl);
    const [, owner, repo] = url.pathname.split("/");
    return { owner, repo };
  } catch {
    return null;
  }
}

export async function getGitHubRepoContext(owner: string, repo: string) {
  const [repoInfo, readmeRes, pkgRes] = await Promise.all([
    octokit.repos.get({ owner, repo }),
    octokit.repos.getReadme({ owner, repo }).catch(() => null),
    octokit.repos
      .getContent({ owner, repo, path: "package.json" })
      .catch(() => null),
  ]);

  const readme =
    readmeRes?.data && "content" in readmeRes.data
      ? Buffer.from(readmeRes.data.content, "base64").toString("utf-8")
      : "";

  const pkg =
    pkgRes?.data && "content" in pkgRes.data
      ? JSON.parse(Buffer.from(pkgRes.data.content, "base64").toString("utf-8"))
      : {};

  return {
    name: repoInfo.data.name,
    description: repoInfo.data.description || "",
    readme,
    dependencies: pkg.dependencies || {},
    scripts: pkg.scripts || {},
  };
}
