import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required." },
        { status: 400 }
      );
    }

    const repoPath = repoUrl
      .replace("https://github.com/", "")
      .replace("http://github.com/", "")
      .replace(/\/$/, "");

    // Repository information
    const repoResponse = await fetch(
      `https://api.github.com/repos/${repoPath}`
    );

    if (!repoResponse.ok) {
      return NextResponse.json(
        { error: "GitHub repository not found." },
        { status: 404 }
      );
    }

    const repo = await repoResponse.json();

    // README
    let readme = "";

    const readmeResponse = await fetch(
      `https://api.github.com/repos/${repoPath}/readme`,
      {
        headers: {
          Accept: "application/vnd.github.raw",
        },
      }
    );

    if (readmeResponse.ok) {
      readme = await readmeResponse.text();
    }

    // Repository tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${repoPath}/git/trees/${repo.default_branch}?recursive=1`
    );

    const treeData = await treeResponse.json();
    const files = treeData.tree || [];

    const fileCount = files.filter(
      (item: any) => item.type === "blob"
    ).length;

    const folderCount = files.filter(
      (item: any) => item.type === "tree"
    ).length;

    const fileNames = files.map((item: any) => item.path.toLowerCase());

    let framework = "Unknown";

    if (fileNames.includes("next.config.js") || fileNames.includes("next.config.ts"))
      framework = "Next.js";
    else if (fileNames.includes("package.json"))
      framework = "React";
    else if (fileNames.some((f: string) => f.includes("vue")))
      framework = "Vue";
    else if (fileNames.some((f: string) => f.includes("angular")))
      framework = "Angular";
    else if (fileNames.some((f: string) => f.includes("express")))
      framework = "Express";

    const hasTests = fileNames.some(
      (f: string) =>
        f.includes("test") ||
        f.includes("__tests__") ||
        f.endsWith(".spec.ts") ||
        f.endsWith(".test.ts") ||
        f.endsWith(".test.js")
    );

    const hasDocker = fileNames.some(
      (f: string) => f.includes("dockerfile")
    );

    const hasGithubActions = fileNames.some(
      (f: string) => f.startsWith(".github/workflows/")
    );

    let packageManager = "Unknown";

    if (fileNames.includes("package-lock.json"))
      packageManager = "npm";
    else if (fileNames.includes("yarn.lock"))
      packageManager = "Yarn";
    else if (fileNames.includes("pnpm-lock.yaml"))
      packageManager = "pnpm";

   const prompt = `
You are RepoPilot AI, an expert software architect and senior code reviewer.

Analyze this GitHub repository.

Repository Name:
${repo.name}

Primary Language:
${repo.language}

Framework:
${framework}

Description:
${repo.description}

README:
${readme.slice(0, 4000)}

Based on the repository information, provide:

1. A short summary.
2. An architecture overview.
3. An overall repository score out of 100.
4. Scores out of 100 for:
   - Documentation
   - Security
   - Maintainability
   - Testing
5. Exactly five improvement suggestions.

Return ONLY valid JSON in this format:

{
  "summary": "Short summary",
  "architecture": "Architecture overview",
  "score": 87,
  "documentation": 82,
  "security": 90,
  "maintainability": 85,
  "testing": 76,
  "suggestions": [
    "...",
    "...",
    "...",
    "...",
    "..."
  ]
}
`;
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an expert software engineer that analyzes GitHub repositories.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      completion.choices[0].message.content ?? "";

    let analysis;

    try {
  let cleaned = responseText.trim();

  // Remove markdown code fences if present
  cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim();

  // Extract only the JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }

  analysis = JSON.parse(cleaned);
} catch {
  analysis = {
    summary: "Repository analyzed successfully.",
    architecture: "Architecture information unavailable.",
    score: 80,
    documentation: 80,
    security: 80,
    maintainability: 80,
    testing: 80,
    suggestions: responseText
      .split("\n")
      .filter((line) => line.trim().length > 0),
  };
}
  return NextResponse.json({
  name: repo.name,
  description: repo.description,
  language: repo.language,
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  updated: repo.updated_at,
  license: repo.license?.name || "None",

  fileCount,
  folderCount,
  framework,
  packageManager,
  hasTests,
  hasDocker,
  hasGithubActions,

  summary: analysis.summary,
  architecture: analysis.architecture,

  score: analysis.score,

  documentation: analysis.documentation,
  security: analysis.security,
  maintainability: analysis.maintainability,
  testing: analysis.testing,

  suggestions: analysis.suggestions,
});
  } catch (error: any) {
    console.error("FULL ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}