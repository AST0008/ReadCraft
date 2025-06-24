import { FileText, Sparkles } from "lucide-react";
import { FaGithub } from "react-icons/fa";

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

const Feature = () => {
  return (
    <>
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
    </>
  );
};

export default Feature;
