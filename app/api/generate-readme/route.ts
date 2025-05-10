import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.input || typeof body.input !== "string") {
      return NextResponse.json(
        {
          error: "Invalid request body. Please provide a project description.",
        },
        { status: 400 }
      );
    }

    const { input, useGemini = true } = body;

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
Create a comprehensive, well-structured README.md file based on the project description provided.

Follow these guidelines:
1. Use proper Markdown formatting with appropriate headings, lists, and code blocks.
2. Include:
   - # Project Title (derive from the project description)
   - ## Description (based on the provided project description)
   - ## Features (list the main features of the project)
   - ## Technologies Used (list technologies mentioned in the description)
   - ## Installation (provide appropriate installation steps)
   - ## Usage (provide usage instructions)
   - ## License (include MIT License by default)
3. Keep the content professional, concise, and well-organized.
4. Output only the README content in Markdown format.
`;

    // Try first with v1 (most current stable API)
    let geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "user", parts: [{ text: input }] },
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
              { role: "user", parts: [{ text: input }] },
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
    console.log("gemini data", geminiData.candidates[0].content);

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
      const readme = geminiData.candidates[0].content?.parts?.[0]?.text || "";
      console.log('readme', readme);
      

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
