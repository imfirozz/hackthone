export default function Footer() {
  return (
    <footer className="mt-0 px-6 pb-8">
      <div className="liquid-glass-card max-w-7xl mx-auto rounded-[32px] px-8 py-14">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="transition-all duration-300 hover:-translate-y-1">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-500 to-yellow-500">
              AI Interviewer
            </h2>
            <p className="text-slate-300 mt-3 text-sm leading-relaxed">
              Practice real-time interviews, improve communication skills,
              and land your dream job with confidence.
            </p>
            <p className="text-amber-500 text-sm mt-2 font-medium">
              Built for ambitious developers 🚀
            </p>
          </div>

          {/* Links */}
          <div className="transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Home</li>
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Features</li>
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Pricing</li>
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Contact</li>
            </ul>
          </div>

          {/* Resources */}
          <div className="transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Blog</li>
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Help Center</li>
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Privacy Policy</li>
              <li className="hover:text-amber-500 transition-all duration-300 hover:translate-x-1 cursor-pointer">Terms of Service</li>
            </ul>
          </div>

          {/* Social */}
          <div className="transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex gap-6 text-slate-300 items-center">
              <span className="flex items-center gap-2 hover:text-amber-500 transition cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 5.92c-.77.35-1.6.58-2.46.69a4.3 4.3 0 0 0 1.88-2.37c-.83.5-1.75.86-2.73 1.06A4.28 4.28 0 0 0 11.1 9.03c0 .34.04.67.1.98A12.13 12.13 0 0 1 3.16 5.1a4.28 4.28 0 0 0 1.32 5.7 4.26 4.26 0 0 1-1.94-.54v.06c0 2.08 1.48 3.82 3.44 4.22-.36.1-.74.15-1.13.15-.28 0-.54-.03-.8-.07a4.29 4.29 0 0 0 4 2.98A8.6 8.6 0 0 1 2 19.54 12.14 12.14 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18 0-.35-.01-.53A8.33 8.33 0 0 0 22 5.92z"/></svg>
                Twitter
              </span>
              <span className="flex items-center gap-2 hover:text-amber-500 transition cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.56a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM20.45 20.45h-3.56v-5.6c0-1.34-.03-3.06-1.86-3.06-1.86 0-2.14 1.45-2.14 2.96v5.7H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.46v6.29z"/></svg>
                LinkedIn
              </span>
              <span className="flex items-center gap-2 hover:text-amber-500 transition cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.9 5.33.9 11.6c0 4.92 3.18 9.1 7.59 10.57.55.1.75-.24.75-.53 0-.26-.01-.95-.01-1.86-3.09.67-3.74-1.49-3.74-1.49-.5-1.27-1.23-1.6-1.23-1.6-1-.69.08-.68.08-.68 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.56 1.2 3.18.92.1-.71.38-1.2.7-1.48-2.47-.28-5.07-1.24-5.07-5.53 0-1.22.44-2.22 1.13-3-.11-.28-.49-1.41.11-2.94 0 0 .92-.3 3.02 1.15a10.5 10.5 0 0 1 5.5 0c2.1-1.45 3.02-1.15 3.02-1.15.6 1.53.22 2.66.11 2.94.7.78 1.13 1.78 1.13 3 0 4.3-2.6 5.25-5.08 5.53.39.34.73 1 .73 2.02 0 1.46-.01 2.64-.01 3 .01.29.2.64.76.53A10.7 10.7 0 0 0 23.1 11.6C23.1 5.33 18.27.5 12 .5z"/></svg>
                GitHub
              </span>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-6 text-center text-sm text-slate-300 tracking-wide">
          © {new Date().getFullYear()} AI Interviewer. All rights reserved.
        </div>

      </div>
    </footer>
  );
}
