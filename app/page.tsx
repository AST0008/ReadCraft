"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Download,
  FileText,
  Sparkles,
  AlertCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Copy } from "lucide-react";
import { toast } from "sonner"; // or your preferred toast lib
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [projectDescription, setProjectDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("")
  const [generatedReadme, setGeneratedReadme] = useState("");
  console.log('generatedReadme',generatedReadme);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  const [error, setError] = useState<string | null>(null);

  const [warning, setWarning] = useState<string | null>(null);
  const [errorType, setErrorType] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [readmeSource, setReadmeSource] = useState(null);
  const [hasApiError, setHasApiError] = useState(false);
  const { toast } = useToast();

  // Auto-enable fallback if API error was detected previously
  useEffect(() => {
    // Only run in the browser
    const storedApiError =
      typeof window !== "undefined"
        ? localStorage.getItem("readme_generator_api_error")
        : null;
    if (storedApiError === "true") {
      setUseFallback(true);
      setHasApiError(true);
      setWarning(
        "Gemini API quota exceeded. Fallback generator enabled automatically."
      );
    }
  }, []);

  const generateReadme = async () => {
    if (!projectDescription.trim()) {
      toast({
        title: "Empty description",
        description: "Please enter a project description first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);
    setErrorType(null);
    setReadmeSource(null);

    try {
      const response = await fetch("/api/generate-readme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: projectDescription,
          useGemini: !useFallback,
          repoUrl:repoUrl
        }),
      });

      // Parse the JSON response
      const data = await response.json();
      console.log("frontend data", data);

      // Set the readme source
      setReadmeSource(data.source || null);

      // Check if there's a warning
      if (data.warning) {
        setWarning(data.warning);
      }

      // Check if the response contains an error but still has a readme (fallback case)
      if (data.error && data.readme) {
        setErrorType(data.errorType || "unknown_error");
        setWarning(data.error);

        // If it's a quota error, store it in localStorage
        if (
          data.errorType === "quota_exceeded" &&
          typeof window !== "undefined"
        ) {
          localStorage.setItem("readme_generator_api_error", "true");
          setHasApiError(true);
          setUseFallback(true);
        }
      }
      // Check if the response contains an error and no readme
      else if (!response.ok || (data.error && !data.readme)) {
        const errorMessage = data.error || "Failed to generate README";
        setErrorType(data.errorType || "unknown_error");

        // Special handling for different error types
        if (data.errorType === "quota_exceeded") {
          if (typeof window !== "undefined") {
            localStorage.setItem("readme_generator_api_error", "true");
          }
          setHasApiError(true);
          setUseFallback(true);
          throw new Error(
            `${errorMessage} Fallback generator has been enabled automatically.`
          );
        } else if (data.errorType === "api_key_missing") {
          throw new Error(
            `${errorMessage} Please add your Gemini API key to the environment variables.`
          );
        } else if (data.errorType === "api_key_invalid") {
          throw new Error(
            `${errorMessage} Please check that your Gemini API key is valid.`
          );
        } else if (data.errorType === "model_not_found") {
          setUseFallback(true);
          throw new Error(`${errorMessage} Using fallback generator instead.`);
        } else {
          throw new Error(errorMessage);
        }
      }

      if (!data.readme) {
        throw new Error("No README content received");
      }

      setGeneratedReadme(data.readme);
      setActiveTab("preview");

      // Show different toast based on source
      if (data.source === "fallback") {
        toast({
          title: "README generated with fallback",
          description:
            "Your README has been generated using the fallback template.",
          variant: "default",
        });
      } else {
        toast({
          title: "README generated!",
          description:
            "Your README has been successfully generated using Gemini.",
        });
      }
    } catch (error) {
      console.error("Error generating README:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "There was an error generating your README. Please try again.";
      setError(errorMessage);
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReadme = () => {
    if (!generatedReadme) return;

    const blob = new Blob([generatedReadme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "README downloaded",
      description: "Your README.md file has been downloaded.",
    });
  };

  // Safe check for localStorage that works with SSR
  const checkLocalStorageValue = (key: any) => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) === "true";
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-10 animate-fade-in">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-3 rounded-full mb-4 shadow-lg">
          <FileText size={24} />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-3 leading-tight">
        ReadCraft
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          Transform your raw project description into a polished, professional{" "}
          <code>README.md</code> file with the power of Google's Gemini AI.
        </p>
      </div>

      {/* Alert for API Quota */}
      {(errorType === "quota_exceeded" || hasApiError) && (
        <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800 transition duration-300 ease-in-out">
          <Info className="h-4 w-4" />
          <AlertTitle>Gemini API Error</AlertTitle>
          <AlertDescription>
            Quota exceeded or API issue detected. Using fallback generator
            instead.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card className="mb-10 border-gradient shadow-md">
        <CardHeader>
          <CardTitle>Generate Your README</CardTitle>
          <CardDescription>
            Enter your project description below and click "Generate README" to
            create a professional markdown file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="preview" disabled={!generatedReadme}>
                Preview
              </TabsTrigger>
            </TabsList>

            {/* Input Tab */}
            <TabsContent value="input" className="space-y-4">
              <Textarea
                placeholder="🎯 Start by describing your project goals, features, stack, etc..."
                className="min-h-[300px] resize-y rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 transition"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
              />

              <h4 >Enter Github URL</h4>
              <Input value={repoUrl}  onChange={(e) => setRepoUrl(e.target.value)}/>

              {/* Warning & Error Blocks */}
              {warning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md flex items-start transition">
                  <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Heads Up</p>
                    <p className="text-sm">{warning}</p>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start transition">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                    {typeof error === "string" &&
                      error?.includes("API key") && (
                        <p className="text-sm mt-1">
                          Make sure your <code>GEMINI_API_KEY</code> is
                          correctly set in your environment variables.
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Fallback Switch */}
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="use-fallback"
                  checked={useFallback}
                  onCheckedChange={setUseFallback}
                  disabled={errorType === "quota_exceeded" || hasApiError}
                />
                <Label
                  htmlFor="use-fallback"
                  className={
                    errorType === "quota_exceeded" || hasApiError
                      ? "text-amber-700 font-medium"
                      : ""
                  }
                >
                  Use fallback generator (no API key required)
                  {(errorType === "quota_exceeded" || hasApiError) &&
                    " - Enabled due to API issues"}
                </Label>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end">
                <Button
                  onClick={generateReadme}
                  disabled={isLoading || !projectDescription.trim()}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate README
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              {generatedReadme && (
                <>
                  {/* Source Indicator */}
                  {readmeSource === "fallback" && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-start">
                      <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Using Fallback Generator</p>
                        <p className="text-sm">
                          This README was generated using a template-based
                          approach.
                        </p>
                      </div>
                    </div>
                  )}
                  {readmeSource === "gemini" && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start">
                      <Sparkles className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Generated with Gemini AI</p>
                        <p className="text-sm">
                          This README was created using Google's Gemini model.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Rendered Markdown */}
                  <div className="border rounded-md p-4 bg-white dark:bg-gray-950 overflow-auto max-h-[500px]">
                    <div className="prose dark:prose-invert max-w-none text-left leading-relaxed text-base">
                      <ReactMarkdown>{generatedReadme}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-2">
                    <Button onClick={downloadReadme} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download README
                    </Button>
                    <CopyToClipboard
                      text={generatedReadme || ""}
                      onCopy={() =>
                        toast({
                          title: "Copied to clipboard!",
                          description:
                            "Your README was successfully copied to your clipboard.",
                        })
                      }
                    >
                      <Button variant="secondary">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy README
                      </Button>
                    </CopyToClipboard>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="border-gradient-subtle hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-2">
              <div className="bg-gradient-to-r from-blue-600/10 to-green-600/10 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-2">
                {feature.icon}
              </div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Final CTA */}
      <div className="text-center mt-16">
        <h2 className="text-2xl font-semibold mb-2">
          Ready to generate your next README?
        </h2>
        <p className="text-muted-foreground mb-4">
          It’s fast, free, and effective.
        </p>
        <Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          🚀 Start Now
        </Button>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm mt-12">
        <p>README AI Generator with Gemini &copy; {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "Gemini-Powered Generation",
    description:
      "Leverages Google's advanced Gemini AI model to create comprehensive, well-structured README files.",
    icon: <Sparkles className="h-5 w-5 text-blue-600" />,
  },
  {
    title: "Markdown Preview",
    description:
      "See exactly how your README will look with our built-in markdown previewer.",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
  },
  {
    title: "One-Click Download",
    description:
      "Download your generated README.md file with a single click, ready to add to your project.",
    icon: <Download className="h-5 w-5 text-blue-600" />,
  },
];
