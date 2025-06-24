import { FileText } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const Header = () => {
  return (
    <>
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
    </>
  );
};
export default Header;
