import React from "react";
import { motion, LazyMotion, domAnimation } from "framer-motion";
import { Link } from "react-router-dom";

export default function Body() {
  const splineRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.customElements.get('spline-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.12.92/build/spline-viewer.js';
      document.body.appendChild(script);
    }
    // Inject the spline-viewer element if not already present
    if (splineRef.current && !splineRef.current.querySelector('spline-viewer')) {
      const viewer = document.createElement('spline-viewer');
      viewer.setAttribute('url', 'https://prod.spline.design/7Ov1JS8yOuOZZxa6/scene.splinecode');
      viewer.style.width = '100%';
      viewer.style.maxWidth = '900px';
      viewer.style.height = '340px';
      viewer.style.margin = '0 auto 2rem';
      viewer.style.display = 'block';
      viewer.style.borderRadius = '24px';
      viewer.style.overflow = 'hidden';
      viewer.style.boxShadow = '0 4px 32px 0 rgba(0,0,0,0.10)';
      viewer.style.background = '#fff';
      splineRef.current.appendChild(viewer);
    }
  }, []);

  const dreamJobCards = [
    {
      title: "Mock Interviews",
      description: "Simulate real interview experience with AI feedback.",
      image:
        "https://t4.ftcdn.net/jpg/08/80/14/63/240_F_880146375_SYk2GHREB68lHG22dcxIZ9zdLwNXdrh9.jpg",
      alt: "Mock interview session",
      primaryButton: "Explore",
      primaryLink: "/mock",
      color: "from-blue-500/20 to-indigo-500/20",
    },
    {
      title: "HR Interview",
      description: "Practice common HR questions and behavioral scenarios.",
      image:
        "https://imgs.search.brave.com/fgKDPqcaT1BqA5j8crh84TiPFA8V6SxEFxKu80l7WhQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9pbnRl/cnZpZXdpbmctY2Fu/ZGlkYXRlLWQtcmVu/ZGVyLXZlY3Rvci1p/bGx1c3RyYXRpb24t/cHJvZmVzc2lvbmFs/LWhyLW1hbmFnZXIt/aGFzLWpvYi1pbnRl/cnZpZXctaHVtYW4t/cmVzb3VyY2VzLXJl/Y3J1aXRpbmctNDAw/ODgyMTkwLmpwZw",
      alt: "HR interview discussion",
      primaryButton: "Explore",
      primaryLink: "/hr-interview",
      color: "from-sky-500/20 to-cyan-500/20",
    },
    {
      title: "Technical Interview",
      description: "Test your technical skills with role-specific questions.",
      image:
        "https://imgs.search.brave.com/6ro9pnEo3O2Q8o6WQUgdaNhO1629gQtJc7BVngPyVbk/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9hc3Nl/dHMuZGVzaWdudGVt/cGxhdGUuaW8vdGh1/LWphbi0xMi0yMDIz/LTItMTAtcG0xMzA3/OC53ZWJw",
      alt: "Technical assessment",
      primaryButton: "Explore",
      primaryLink: "/technical",
      color: "from-emerald-500/20 to-teal-500/20",
    },
  ];
  const whyChooseUs = [
    {
      icon: "🤖",
      title: "AI-Powered Feedback",
      description:
        "Get instant, personalized feedback on your answers, body language tips, and improvement suggestions.",
      color: "from-blue-400 to-indigo-500",
      image:
        "https://imgs.search.brave.com/ACCXCl0UJRqdmcdeUjJ4erZVBhz8YMdePfgPehsK_dQ/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNzcv/MDg5LzQ1Ny9zbWFs/bC9haS1zZW50aW1l/bnQtYW5hbHlzaXMt/aWxsdXN0cmF0aW9u/LWNoYXRib3Qtcm9i/b3QtZW1vdGlvbnMt/ZmVlZGJhY2stY3Vz/dG9tZXItcmV2aWV3/cy1hdXRvbWF0aW9u/LXRlY2hub2xvZ3kt/ZnJlZS12ZWN0b3Iu/anBn",
    },
    {
      icon: "🎭",
      title: "Realistic Simulations",
      description:
        "Practice with lifelike interview scenarios that mirror actual company processes and expectations.",
      color: "from-cyan-400 to-sky-500",
      image:
        "https://thumbs.dreamstime.com/b/people-hr-interview-cartoon-woman-sitting-panel-applying-job-recruitment-behind-office-desk-recruiters-interviewing-194548068.jpg",
    },
    {
      icon: "📚",
      title: "Comprehensive Question Bank",
      description:
        "Access thousands of curated questions across industries, roles, and difficulty levels.",
      color: "from-emerald-400 to-teal-500",
      image:
        "https://www.shutterstock.com/image-vector/study-much-isolated-cartoon-vector-260nw-2397538177.jpg",
    },
    {
      icon: "📊",
      title: "Progress Tracking & Analytics",
      description:
        "Visualize your improvement over time with detailed performance metrics and insights.",
      color: "from-purple-400 to-indigo-500",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwLiJS5dBeZOv8Ch63my2efaLEpstFY3jOog&s",
    },
  ];

  return (
    <div className="relative overflow-hidden px-6 py-16 md:px-8">
      {/* Spline 3D Viewer at the top of the Home page */}
      <div ref={splineRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '2rem' }} />
      <LazyMotion features={domAnimation}>
        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, type: "spring", bounce: 0.3 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white tracking-tight">
              Prepare for Your{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-300 to-cyan-300">
                Dream Job
              </span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto text-lg font-light leading-relaxed">
              Master every stage of your interview journey with AI-powered
              tools, realistic simulations, and guided practice across every
              track.
            </p>
          </motion.div>

          <div className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {dreamJobCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 15,
                  mass: 1,
                  delay: index * 0.08,
                }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="liquid-glass-card group overflow-hidden rounded-2xl border border-white/10 transition-all duration-500 hover:border-white/20"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div
                    className={`absolute inset-0 bg-linear-to-t ${card.color} mix-blend-screen transition-opacity duration-500 group-hover:opacity-85`}
                  />
                </div>
                <div className="p-6 text-center">
                  <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                    {card.title}
                  </h2>
                  <p className="mb-4 text-sm font-light leading-relaxed text-slate-300">
                    {card.description}
                  </p>
                  <Link
                    to={card.primaryLink}
                    onClick={() => window.scrollTo(0, 0)}
                    className="liquid-glass-button group/btn inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:scale-105"
                  >
                    {card.primaryButton}
                    <span className="ml-2 inline-block transition-transform duration-300 group-hover/btn:translate-x-1">
                      →
                    </span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Why Choose Us Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, type: "spring", bounce: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              Why Choose{" "}
              <span className="bg-clip-text text-transparent bg-linear-to-r from-amber-300 to-yellow-400">
                Us ?
              </span>
            </h2>
            <p className="text-slate-300 mt-4 max-w-2xl mx-auto text-lg font-light">
              Discover what makes our platform the smartest way to prepare,
              practice, and succeed in interviews.
            </p>
          </motion.div>

          <div className="mt-24 mb-24 space-y-16">
            {whyChooseUs.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 20,
                  delay: idx * 0.15,
                }}
                whileHover={{
                  scale: 1.02,
                  y: -5,
                  transition: { type: "spring", stiffness: 300 },
                }}
                className="liquid-glass-card grid max-w-7xl grid-cols-1 items-center gap-10 rounded-2xl px-6 py-10 transition-all duration-500 md:grid-cols-2 md:px-10"
              >
                {/* Image (alternate sides) */}
                <div className={`${idx % 2 !== 0 ? "md:order-2" : ""}`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-75 md:h-95 object-cover rounded-xl transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Content */}
                <div className={`${idx % 2 !== 0 ? "md:order-1" : ""}`}>
                  <p className="text-sm text-amber-600 font-semibold mb-2">
                    Why Choose Us
                  </p>

                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {item.title}
                  </h2>

                  <p className="text-slate-300 mb-4">{item.description}</p>

                  <ul className="space-y-2 mb-5">
                    {item.title === "AI-Powered Feedback" && (
                      <>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            1
                          </span>
                          Instant AI evaluation of answers
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            2
                          </span>
                          Personalized improvement tips
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            3
                          </span>
                          Smart scoring & performance insights
                        </li>
                      </>
                    )}

                    {item.title === "Realistic Simulations" && (
                      <>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            1
                          </span>
                          Company-like interview environment
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            2
                          </span>
                          Role-based mock interviews
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            3
                          </span>
                          Real-time question flow
                        </li>
                      </>
                    )}

                    {item.title === "Comprehensive Question Bank" && (
                      <>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            1
                          </span>
                          Thousands of curated questions
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            2
                          </span>
                          Covers multiple domains & roles
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            3
                          </span>
                          Beginner to advanced difficulty
                        </li>
                      </>
                    )}

                    {item.title === "Progress Tracking & Analytics" && (
                      <>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            1
                          </span>
                          Detailed performance dashboard
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            2
                          </span>
                          Track improvement over time
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-white text-sm">
                            3
                          </span>
                          Identify strengths & weaknesses
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Crack Interviews Section */}
          <motion.div
            id="features"
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1.2, type: "spring", bounce: 0.3 }}
            className="mt-24 mb-24 scroll-mt-28"
          >
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight text-center">
                Crack Interviews{" "}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-amber-300 to-yellow-400">
                  with ease
                </span>
              </h2>

              <p className="text-slate-300 text-lg leading-relaxed mb-6 text-center max-w-2xl mx-auto">
                Experience real-time AI-powered interviews that feel just like
                the real thing. Practice speaking, improve confidence, and get
                instant feedback — all in one place.
              </p>

              <div className="mt-16 space-y-24">
                {[
                  {
                    title: "Customize Mock Interviews",
                    desc: "Design interview sessions tailored to specific roles, companies, and industries. Choose difficulty levels, question types, and formats to simulate real hiring processes and build role-specific confidence. This feature helps you build real-world confidence by practicing in structured environments, understanding interviewer expectations, and continuously refining your answers with guided improvements.",
                    img: "https://imgs.search.brave.com/D0DfGFGAhDB2JmKuCjnBYPmmb7vENuq6psYUH3OOCoo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQx/MDk1NTIzNC92ZWN0/b3IvaW50ZXJ2aWV3/LmpwZz9zPTYxMng2/MTImdz0wJms9MjAm/Yz1hTTJ6XzdPZ3RM/Y3N2V2VwMUVVWk9Q/NDB6Ry1rRmI4dkwz/VG1uOEZJd19NPQ",
                  },
                  {
                    title: "Voice-to-Voice Interaction",
                    desc: "Engage in natural, real-time conversations with AI that mimic human interviewers. Improve fluency, articulation, and confidence by practicing spoken responses instead of just typing answers. This feature helps you build real-world confidence by practicing in structured environments, understanding interviewer expectations, and continuously refining your answers with guided improvements.",
                    img: "https://imgs.search.brave.com/LbJq8P9S-X1a5N0TaXAv5L0ELCwPt9m2E4CVQccuVzo/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTYy/ODk3ODAzMS92ZWN0/b3Ivdm9pY2Utc2Vh/cmNoLWNvbmNlcHQt/YWktdm9pY2UtcmVj/b2duaXRpb24tdGVj/aG5vbG9neS12aXJ0/dWFsLXZvaWNlLWFz/c2lzdGFudC12ZWN0/b3IuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPWNoeXJ0Z2hR/N2h6cEtaamF5VjE3/ZDRESFJuX3I1d3J6/UDkzNlFzMndHN009",
                  },
                  {
                    title: "Performance Reports",
                    desc: "Receive in-depth reports after every session, including scores, strengths, weaknesses, and actionable insights to continuously improve your interview performance. This feature helps you build real-world confidence by practicing in structured environments, understanding interviewer expectations, and continuously refining your answers with guided improvements.",
                    img: "https://imgs.search.brave.com/yTV7gz3B3KRG8CADsaCGXKGpfoczYWAlQs8z5u7_3iI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ3/NzI0MzY2MC92ZWN0/b3IvZmxhdC1kZXNp/Z24tY2FydG9vbi1p/bGx1c3RyYXRpb24t/YnVzaW5lc3MtYW5h/bHl0aWNzLWNvbmNl/cHQuanBnP3M9NjEy/eDYxMiZ3PTAmaz0y/MCZjPXlRbmtuMlRq/dzZYZXFVOGFTT0tn/WG1SWkZBWG8yNjF4/NkhMV1k5cXhGOGs9",
                  },
                  {
                    title: "Advanced Evaluation",
                    desc: "Our AI evaluates tone, clarity, confidence, and communication skills, giving you a holistic understanding of how you present yourself in interviews. This feature helps you build real-world confidence by practicing in structured environments, understanding interviewer expectations, and continuously refining your answers with guided improvements.",
                    img: "https://imgs.search.brave.com/07YRSZeISLA9kqIwGn7RUkaDjqinwYYrllbBMRRCuOU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA1LzkzLzMyLzU0/LzM2MF9GXzU5MzMy/NTQ4OV92VFhDUTBm/OTJQUTdEWTJjT2xs/R3lCWVdLaGdJWjQ1/Sy5qcGc",
                  },
                  {
                    title: "Smart Feedback",
                    desc: "Get intelligent suggestions, ideal answers, and improvement tips based on your responses so you can refine your approach and stand out to recruiters. This feature helps you build real-world confidence by practicing in structured environments, understanding interviewer expectations, and continuously refining your answers with guided improvements.",
                    img: "https://imgs.search.brave.com/ol5CW5FeqUwPerxBTN1C9e3w5p_u9nrKdssiGHc-Dps/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90aHVt/YnMuZHJlYW1zdGlt/ZS5jb20vYi9jdXN0/b21lci1yZXZpZXct/dXNlci1mZWVkYmFj/ay1ldmFsdWF0aW9u/LWVtcGxveWVlLWNh/bmRpZGF0ZS13b3Jr/LWN1c3RvbWVyLXJl/dmlldy11c2VyLWZl/ZWRiYWNrLWV2YWx1/YXRpb24tMTA4NDY0/NTY0LmpwZw",
                  },
                  {
                    title: "Answer Replay",
                    desc: "Replay your recorded answers to analyze mistakes, improve delivery, and accelerate your learning with self-review and AI insights combined. This feature helps you build real-world confidence by practicing in structured environments, understanding interviewer expectations, and continuously refining your answers with guided improvements.",
                    img: "https://imgs.search.brave.com/I4gFT5y-eYADdtd5hgOnieD-9riqpQ2RFEb28U5iyUA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMjIw/MjMxODQ3OC92ZWN0/b3Ivc2VvLmpwZz9z/PTYxMng2MTImdz0w/Jms9MjAmYz1EMzct/bVh1ZDZtdzR1a2lS/SUFWWVlkMUJTOFdf/dmRPTFpZeDJvVE4z/SzhnPQ",
                  },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 60, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{
                      type: "spring",
                      stiffness: 70,
                      damping: 20,
                      delay: idx * 0.1,
                    }}
                    whileHover={{
                      y: -6,
                      transition: { type: "spring", stiffness: 300 },
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
                  >
                    {/* Image Container - only here we apply hover scale */}
                    <motion.div
                      initial={{ opacity: 0, x: idx % 2 === 0 ? -40 : 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      whileHover={{ scale: 1.02 }}
                      className={`${idx % 2 !== 0 ? "md:order-2" : ""} p-2`}
                    >
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-80 md:h-96 object-cover rounded-2xl transition-transform duration-300 ease-out"
                      />
                    </motion.div>

                    {/* Content */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{
                        duration: 0.6,
                        delay: 0.1,
                        ease: "easeOut",
                      }}
                      className={`${
                        idx % 2 !== 0 ? "md:order-1" : ""
                      } p-4 md:p-6`}
                    >
                      <p className="text-sm text-indigo-600 font-semibold mb-2">
                        Feature
                      </p>
                      <h3 className="text-3xl font-bold text-white mb-4">
                        {item.title}
                      </h3>
                      <p className="text-slate-300 leading-relaxed text-base">
                        {item.desc}
                      </p>
                      <div className="mt-4 h-px w-16 bg-indigo-300/40"></div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Companies Associated Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-24 mb-16"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                Companies{" "}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-amber-300 to-yellow-400">
                  Associated with Us
                </span>
              </h2>
              <p className="text-slate-300 mt-4 max-w-2xl mx-auto text-lg font-light">
                Practice and get prepared for interviews at top global tech
                companies.
              </p>
            </div>

            <div className="relative overflow-x-hidden group py-4 [--logoloop-gap:60px] [--logoloop-logoHeight:48px]">
              <div className="flex w-max animate-scroll">
                {[
                  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",
                  "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/01/LinkedIn_Logo.svg",
                ].map((logo, i) => (
                  <div key={i} className="flex-none mr-15">
                    <img
                      src={logo}
                      alt="company logo"
                      className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                ))}

                {/* Duplicate for smooth loop */}
                {[
                  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png",

                  "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/08/Cisco_logo_blue_2016.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",

                  "https://upload.wikimedia.org/wikipedia/commons/a/a9/Slack_Technologies_Logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
                  "https://upload.wikimedia.org/wikipedia/commons/0/01/LinkedIn_Logo.svg",
                ].map((logo, i) => (
                  <div key={"dup-" + i} className="flex-none mr-15">
                    <img
                      src={logo}
                      alt="company logo"
                      className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </LazyMotion>
      <style>{`
          html {
            scroll-behavior: smooth;
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.05); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
          }
          @keyframes float-medium {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-25px, 25px) scale(1.03); }
            66% { transform: translate(15px, -15px) scale(0.97); }
          }
          @keyframes float-fast {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, 20px) scale(1.02); }
            66% { transform: translate(-20px, -20px) scale(0.98); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.1); }
          }
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-gradient-shift {
            background-size: 200% 200%;
            animation: gradient-shift 15s ease infinite;
          }
          .animate-float-slow {
            animation: float-slow 20s ease-in-out infinite;
          }
          .animate-float-medium {
            animation: float-medium 15s ease-in-out infinite;
          }
          .animate-float-fast {
            animation: float-fast 12s ease-in-out infinite;
          }
          .animate-pulse-slow {
            animation: pulse-slow 6s ease-in-out infinite;
          }
          .animate-scroll {
            animation: scroll 25s linear infinite;
          }
        `}</style>
    </div>
  );
}
