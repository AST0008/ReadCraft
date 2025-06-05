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
import { FaGithub } from "react-icons/fa";
import {
  Loader2,
  Download,
  FileText,
  Sparkles,
  AlertCircle,
  Info,
  ChevronDown,
  Edit3,
  Github,
  HelpCircle,
  Eye,
  GitCommit,
  ArrowRight,
  User,
  Star,
  Twitter,
  Linkedin,
  ChevronUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { fetchCommitHistory } from "@/lib/utils";
import { motion } from "framer-motion";
import PrismTheme from "react-syntax-highlighter";

type Commit = {
  message: string;
  date?: string;
  author?: string;
  sha: string;
};

interface CodeProps {
  node: any;
  inline: boolean;
  className?: string;
  children: React.ReactNode[];
  [key: string]: any;
}

export default function Home() {
  const [projectDescription, setProjectDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [generatedReadme, setGeneratedReadme] = useState("");
  console.log("generatedReadme", generatedReadme);

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("input");
  const [error, setError] = useState<string | null>(null);

  const [warning, setWarning] = useState<string | null>(null);
  const [errorType, setErrorType] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [readmeSource, setReadmeSource] = useState(null);
  const [hasApiError, setHasApiError] = useState(false);
  const [commitHistory, setCommitHistory] = useState<Commit[]>([]);
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

  useEffect(() => {
    const extractRepoInfo = async () => {
      if (!repoUrl) return;

      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, owner, repo] = match;
        const commits = await fetchCommitHistory(owner, repo);
        setCommitHistory(commits);
      }
    };

    extractRepoInfo();
  }, [repoUrl]);

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
          repoUrl: repoUrl,
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

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardHover = {
    rest: { scale: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    hover: { scale: 1.03, boxShadow: "0 6px 20px rgba(0,0,0,0.15)" },
  };

  const pulse = {
    animate: {
      scale: [1, 1.04, 1],
      transition: { repeat: Infinity, duration: 2 },
    },
  };

  // Safe check for localStorage that works with SSR
  const checkLocalStorageValue = (key: any) => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(key) === "true";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Enhanced Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600 dark:text-blue-400 w-8 h-8 transition-transform hover:scale-110" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              ReadCraft
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="#features"
              className="hidden md:block text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Features
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section with Improved Visual Hierarchy */}
      <section className="relative flex flex-col items-center justify-center h-[80vh] bg-gradient-to-br from-blue-600 to-green-600 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="text-center px-4 z-10">
          <div className="relative inline-block mb-6">
            <FileText className="mx-auto w-16 h-16 text-white" />
            <div className="absolute -inset-4 bg-white/20 rounded-full animate-ping opacity-75"></div>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              AI-Powered README Generator
            </span>
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transform your project description into a professional{" "}
            <span className="font-semibold">README.md</span> in seconds, powered
            by Google's Gemini AI.
          </p>
          <Button
            onClick={() =>
              document
                .getElementById("generator")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-white text-blue-600 hover:bg-gray-50 font-semibold rounded-full px-8 py-4 shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Get Started Now →
          </Button>
        </div>

        {/* Animated scroll indicator */}
        <div className="absolute bottom-8 animate-bounce-slow">
          <ChevronDown className="w-8 h-8 text-white/80" />
        </div>
      </section>

      {/* Generator Section with Improved Layout */}
      <section id="generator" className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Create Your Perfect README
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Describe your project below and let our AI craft a comprehensive
              README tailored to your needs.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Input Panel with Better Organization */}
              <div className="p-8 md:p-10 bg-white dark:bg-gray-800">
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold mb-3 flex items-center">
                    <Edit3 className="w-5 h-5 mr-2 text-blue-500" />
                    Project Details
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Tell us about your project - what it does, key features,
                    tech stack, and any special instructions.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label
                        htmlFor="project-description"
                        className="block text-sm font-medium mb-2"
                      >
                        Project Description *
                      </Label>
                      <Textarea
                        id="project-description"
                        placeholder="🎯 e.g., A modern task management app built with React, Node.js, and MongoDB featuring real-time updates and drag-and-drop interface..."
                        className="w-full min-h-[200px] resize-y rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition p-4"
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="repo-url"
                        className="block text-sm font-medium mb-2"
                      >
                        GitHub Repository URL (optional)
                      </Label>
                      <div className="relative">
                        <Github className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                          id="repo-url"
                          placeholder="https://github.com/username/repo"
                          className="w-full pl-10 rounded-lg border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Messages with Better Visibility */}
                {warning && (
                  <Alert className="mt-6 bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                    <Info className="h-5 w-5 mr-2" />
                    <div>
                      <AlertTitle className="font-medium">Heads Up</AlertTitle>
                      <AlertDescription className="text-sm">
                        {warning}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {error && (
                  <Alert className="mt-6 bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <div>
                      <AlertTitle className="font-medium">Error</AlertTitle>
                      <AlertDescription className="text-sm">
                        {error}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* Settings Section */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Switch
                        id="use-fallback"
                        checked={useFallback}
                        onCheckedChange={setUseFallback}
                        disabled={errorType === "quota_exceeded" || hasApiError}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                      />
                      <Label
                        htmlFor="use-fallback"
                        className={
                          errorType === "quota_exceeded" || hasApiError
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }
                      >
                        Use fallback generator
                        {(errorType === "quota_exceeded" || hasApiError) &&
                          " (API issue detected)"}
                      </Label>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p className="text-sm">
                            The fallback generator uses templates when the AI
                            service is unavailable, still producing quality
                            READMEs but with less customization.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <Button
                    onClick={generateReadme}
                    disabled={isLoading || !projectDescription.trim()}
                    className="w-full mt-8 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold rounded-full py-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate README
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Preview Panel with Enhanced Markdown Styling */}
              <div className="p-8 md:p-10 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-blue-500" />
                    Preview
                  </h3>
                  {generatedReadme && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={downloadReadme}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <CopyToClipboard
                        text={generatedReadme}
                        onCopy={() =>
                          toast({
                            title: "Copied to clipboard!",
                            description: "Your README was copied.",
                          })
                        }
                      >
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-full"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </CopyToClipboard>
                    </div>
                  )}
                </div>

                {!generatedReadme ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400">
                    <FileText className="w-12 h-12 mb-4 opacity-40" />
                    <p className="text-lg font-medium mb-2">
                      No README Generated Yet
                    </p>
                    <p className="text-sm max-w-xs text-center">
                      Describe your project and click "Generate README" to see
                      the magic happen.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Source Indicator */}
                    <div className="mb-6">
                      {errorType === "quota_exceeded" || hasApiError ? (
                        <Alert className="bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                          <Info className="h-5 w-5 mr-2" />
                          <div>
                            <AlertTitle className="font-medium">
                              Fallback Generator
                            </AlertTitle>
                            <AlertDescription className="text-sm">
                              Using template-based README (AI service currently
                              unavailable)
                            </AlertDescription>
                          </div>
                        </Alert>
                      ) : (
                        <Alert className="bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
                          <Sparkles className="h-5 w-5 mr-2" />
                          <div>
                            <AlertTitle className="font-medium">
                              Gemini AI
                            </AlertTitle>
                            <AlertDescription className="text-sm">
                              AI-powered README generated with your project
                              details
                            </AlertDescription>
                          </div>
                        </Alert>
                      )}
                    </div>

                    {/* Markdown Render */}
                    <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 prose dark:prose-invert prose-sm sm:prose-base max-w-none">
                      <ReactMarkdown
                        components={{
                          code({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }: any) {
                            const match = /language-(\w+)/.exec(
                              className || ""
                            );
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={oneDark as any}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-lg mb-4 text-sm"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code
                                className={`${
                                  className ?? ""
                                } bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md text-sm`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          h1: ({ node, ...props }) => (
                            <h1
                              className="text-2xl font-bold mt-6 mb-4 border-b pb-2"
                              {...props}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              className="text-xl font-semibold mt-5 mb-3 border-b pb-1"
                              {...props}
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              {...props}
                            />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {generatedReadme}
                      </ReactMarkdown>
                    </div>

                    {/* Recent Commits */}
                    {commitHistory.length > 0 && (
                      <Card className="mb-8 bg-gray-100 dark:bg-gray-800 mt-8">
                        <CardHeader>
                          <CardTitle>Recent Commits</CardTitle>
                          <CardDescription>
                            Latest updates from your GitHub repository
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {commitHistory.map((commit, index) => (
                              <li key={index} className="border-b pb-2">
                                <p className="font-medium">{commit.message}</p>
                                <p className="text-muted-foreground">
                                  by {commit.author} •{" "}
                                  {commit.date
                                    ? new Date(commit.date).toLocaleString()
                                    : "Unknown date"}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Improved Card Design */}
      <section id="features" className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose ReadCraft?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              The most comprehensive README generator with AI-powered features
              to make your project shine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-8 h-full flex flex-col">
                  <div className="bg-gradient-to-r from-blue-500 to-green-500 p-3 rounded-xl w-12 h-12 flex items-center justify-center mb-6 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 flex-grow">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Developers
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mb-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card
                key={idx}
                className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition"
              >
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">{testimonial.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex mt-4 space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Final CTA with Gradient Background */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
            Ready to Elevate Your Documentation?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join thousands of developers who save hours on documentation with
            ReadCraft.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() =>
                document
                  .getElementById("generator")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-white text-green-600 hover:bg-gray-50 font-semibold rounded-full px-8 py-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              Generate Your README Now
            </Button>
            {/* <Button
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white/10 font-semibold rounded-full px-8 py-4 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95"
            >
              Learn More
            </Button> */}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 py-12">
        <div className="max-w-4xl mx-auto  px-4  sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-centermb-4">
                <FileText className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                <h3 className="text-lg font-bold ml-2">ReadCraft</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered README generator for developers who value their time
                and project quality.
              </p>
            </div>

            {/* <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div> */}

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Connect
              </h4>
              <div className="flex space-x-4">
                {/* <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <Twitter className="w-5 h-5" />
                </a> */}
                <a
                  href="https://github.com/AST0008"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/ashwajit-tayade-868709296/"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} ReadCraft. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-xl hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 z-40"
        aria-label="Back to top"
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </div>
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
      "See exactly how your README will look with our built-in markdown previewer, along with downloading your generated README.md file with a single click",
    icon: <FileText className="h-5 w-5 text-blue-600" />,
  },
  {
    title: "GitHub Context",
    description:
      "Enter your GitHub repo to improve the context for generating the README",
    icon: <FaGithub className="h-5 w-5 text-blue-600" />,
  },
];

// {/* Testimonials Section */}
// <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
//   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//     <div className="text-center mb-12">
//       <h2 className="text-3xl md:text-4xl font-bold mb-4">
//         Loved by Developers
//       </h2>
//       <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto mb-6"></div>
//     </div>

//     {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//   {testimonials.map((testimonial, idx) => (
//     <Card key={idx} className="border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
//       <CardContent className="p-6">
//         <div className="flex items-center mb-4">
//           <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
//             <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
//           </div>
//           <div>
//             <h4 className="font-medium">{testimonial.name}</h4>
//             <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
//           </div>
//         </div>
//         <p className="text-gray-600 dark:text-gray-300 italic">
//           "{testimonial.quote}"
//         </p>
//         <div className="flex mt-4 space-x-1">
//           {[...Array(5)].map((_, i) => (
//             <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   ))}
// </div> */}
//   </div>
// </section>
