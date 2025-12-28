import { getGitHubRepoContext, parseGitHubUrl } from "@/lib/utils";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const generateFallbackReadme = (projectDescription: string) => {
  let title = "Project Title";
  if (projectDescription.includes("\n")) {
    title = projectDescription.split("\n")[0].trim();
  } else if (projectDescription.includes(".")) {
    title = projectDescription.split(".")[0].trim();
  } else if (projectDescription.length < 50) {
    title = projectDescription.trim();
  }

  if (title.length > 100) {
    title = title.substring(0, 100) + "...";
  }

  let features = "";
  if (
    projectDescription.includes("•") ||
    projectDescription.includes("*") ||
    projectDescription.includes("-")
  ) {
    const lines = projectDescription.split("\n");
    const bulletPoints = lines.filter(
      (line) =>
        line.trim().startsWith("•") ||
        line.trim().startsWith("*") ||
        line.trim().startsWith("-")
    );

    if (bulletPoints.length > 0) {
      features = bulletPoints
        .map((point) => `- ${point.replace(/^[•*-]\s*/, "")}`)
        .join("\n");
    }
  }

  if (!features) {
    features = `- Feature 1\n- Feature 2\n- Feature 3`;
  }

  const techKeywords = [
    "React",
    "Next.js",
    "Vue",
    "Angular",
    "JavaScript",
    "TypeScript",
    "Node.js",
    "Express",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Firebase",
    "AWS",
    "Docker",
    "Kubernetes",
    "Python",
    "Django",
    "Flask",
    "Ruby",
    "Rails",
    "PHP",
    "Laravel",
    "Go",
    "Rust",
    "Swift",
    "Kotlin",
  ];

  const detectedTech = techKeywords.filter((tech) =>
    projectDescription.toLowerCase().includes(tech.toLowerCase())
  );

  let technologies =
    detectedTech.length > 0
      ? detectedTech.map((tech) => `- ${tech}`).join("\n")
      : `- Technology 1\n- Technology 2\n- Technology 3`;

  return `# ${title}

## Description
${
  projectDescription.length > 500
    ? projectDescription.substring(0, 500) + "..."
    : projectDescription
}

## Features
${features}

## Technologies Used
${technologies}

## Installation
\`\`\`bash
# Clone the repository
git clone https://github.com/username/project.git

# Navigate to the project directory
cd project

# Install dependencies
npm install

# Start the application
npm start
\`\`\`

## Usage
Describe how to use the project and provide examples.

## License
MIT License

---
*Note: This README was generated using a fallback template because the Gemini API was unavailable.*
`;
};


const cleanMarkdownResponse = (content:any) => {
  // First, check if we have a markdown code block wrapper
  const markdownBlockRegex = /^```(?:markdown|md)?\s*\n([\s\S]*?)```\s*$/;
  const match = content.match(markdownBlockRegex);
  
  if (match && match[1]) {
    // Return just the content inside the code block
    return match[1];
  }
  
  return content;
};

const trimMarkdownWrapper = (content: any) => {
  // Check if the content starts with ```markdown and ends with ```
  let trimmedContent = content.trim();
  
  // Check if the content is wrapped in a markdown code block
  if (
    (trimmedContent.startsWith('```markdown') || trimmedContent.startsWith('```md')) && 
    trimmedContent.endsWith('```')
  ) {
    // Find the first line break after the opening backticks
    const firstLineBreakIndex = trimmedContent.indexOf('\n');
    if (firstLineBreakIndex !== -1) {
      // Remove the first line (```markdown) and the last line (```)
      trimmedContent = trimmedContent
        .substring(firstLineBreakIndex + 1, trimmedContent.length - 3)
        .trim();
    }
  }

  return trimmedContent;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const { description, repoUrl, useGemini = true } = body || {};

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request body. Please provide a project description.",
        },
        { status: 400 }
      );
    }

    const input = description.trim();

    if (!useGemini) {
      const fallbackReadme = generateFallbackReadme(input);
      return NextResponse.json({ readme: fallbackReadme, source: "fallback" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackReadme = generateFallbackReadme(input);
      return NextResponse.json({
        readme: fallbackReadme,
        source: "fallback",
        warning: "Gemini API key is not configured.",
        errorType: "api_key_missing",
      });
    }

    const systemPrompt = `
    You are an expert technical writer. Based on the provided project description and GitHub repository context (including README content, package.json data, and repo metadata), generate a professional and comprehensive README.md file.
    
    ### Your README should follow this structure:
    1. # Project Title (derive from repo name or user input)
    2. ## Description (summarize key purpose and functionality)
    3. ## Features (list major features based on the content)
    4. ## Technologies Used (detect from dependencies, scripts, or text)
    5. ## Installation (include correct commands based on tech stack)
    6. ## Usage (brief steps or code to use the project)
    7. ## License (default to MIT unless stated otherwise)
    
    ### Guidelines:
    - Use Markdown formatting with headings, code blocks, and lists.
    - Keep it concise, clear, and developer-friendly.
    - If package.json or README.md is available, extract relevant info.
    - If both GitHub and user input are available, merge both sources wisely.
    
    Only return the README content in Markdown format.
    `;

    let finalDescription = input || "";

    if (repoUrl) {
      const parsed = parseGitHubUrl(repoUrl);
      if (!parsed) {
        return NextResponse.json(
          { error: "Invalid GitHub repo URL." },
          { status: 400 }
        );
      }

      const context = await getGitHubRepoContext(parsed.owner, parsed.repo);
      finalDescription = `
Project Name: ${context.name}
${context.description ? `Description: ${context.description}` : ""}
Dependencies: ${Object.keys(context.dependencies).join(", ")}
Scripts: ${Object.keys(context.scripts).join(", ")}

README Snippet:
${context.readme.substring(0, 800)}
${input ? `\n\nAdditional user-provided description:\n${input}` : ""}
  `;
    }

    // Try first with v1 (most current stable API)
    let geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "user", parts: [{ text: finalDescription }] },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    // If v1 fails, try with v1beta as fallback
    if (!geminiResponse.ok) {
      console.log("Trying v1beta API endpoint as fallback");
      geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "user", parts: [{ text: finalDescription }] },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );
    }

    const geminiData = await geminiResponse.json();
    // console.log("gemini data", geminiData.candidates[0].content);

    // Handle potential error cases
    if (geminiData.error) {
      const errorMessage = geminiData.error.message || "Gemini API error";
      let errorType = "unknown_error";

      if (errorMessage.includes("quota")) {
        errorType = "quota_exceeded";
      } else if (errorMessage.includes("key")) {
        errorType = "api_key_invalid";
      } else if (
        errorMessage.includes("not found") ||
        errorMessage.includes("not supported")
      ) {
        errorType = "model_not_found";
      }

      console.error("Gemini API error:", errorMessage);

      const fallbackReadme = generateFallbackReadme(input);
      return NextResponse.json({
        readme: fallbackReadme,
        source: "fallback",
        error: errorMessage,
        errorType: errorType,
      });
    }

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      let readme = geminiData.candidates[0].content?.parts?.[0]?.text || "";
      console.log("readme", readme);

      if (!readme.trim()) {
        const fallbackReadme = generateFallbackReadme(input);
        return NextResponse.json({
          readme: fallbackReadme,
          source: "fallback",
          warning: "Gemini returned empty content.",
        });
      }

      

      return NextResponse.json({ readme, source: "gemini" });
    } else {
      const fallbackReadme = generateFallbackReadme(input);
      return NextResponse.json({
        readme: fallbackReadme,
        source: "fallback",
        warning: "Unexpected Gemini API response.",
      });
    }
  } catch (error: any) {
    console.error("Gemini error:", error);
    const fallbackReadme = generateFallbackReadme(error.message || "Project");
    return NextResponse.json({
      readme: fallbackReadme,
      source: "fallback",
      error: "Internal server error: " + (error.message || "Unknown error"),
      errorType: "unknown_error",
    });
  }
}
