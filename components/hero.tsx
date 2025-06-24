import { ChevronDown, FileText } from "lucide-react";
import { Button } from "./ui/button";

const Hero = () => {
  return (
    <>
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
    </>
  );
};

export default Hero;
