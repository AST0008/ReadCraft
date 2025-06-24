import { FileText, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <>
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

            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
                Connect
              </h4>
              <div className="flex space-x-4">
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
    </>
  );
};
export default Footer;
