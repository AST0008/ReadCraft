import { Button } from "./ui/button";

const CTA = () => {
  return (
    <>
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
          </div>
        </div>
      </section>
    </>
  );
};

export default CTA;
