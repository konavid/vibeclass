'use client'

import { useState, useEffect, useRef } from 'react'

export default function ConsultingPage() {
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/consulting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSubmitted(true)
        setFormData({
          company: '',
          name: '',
          email: '',
          phone: '',
          service: '',
          message: ''
        })
      } else {
        alert('Thank you for your inquiry. We will get back to you soon.')
      }
    } catch (error) {
      alert('Thank you for your inquiry. We will get back to you soon.')
    } finally {
      setLoading(false)
    }
  }

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll reveal animation
  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll('.reveal')
      const windowHeight = window.innerHeight

      reveals.forEach(element => {
        const elementTop = element.getBoundingClientRect().top
        const revealPoint = 100

        if (elementTop < windowHeight - revealPoint) {
          element.classList.add('active')
        }
      })
    }

    window.addEventListener('scroll', reveal)
    reveal()

    return () => window.removeEventListener('scroll', reveal)
  }, [])

  // Floating particles
  useEffect(() => {
    const canvas = document.getElementById('particles') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = []
    const isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 30 : 80

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1
      })
    }

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
        ctx.fill()

        // Draw connections
        particles.forEach((otherParticle, j) => {
          if (i === j) return
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 120) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * (1 - distance / 120)})`
            ctx.stroke()
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Syne', sans-serif" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        /* Reveal animations */
        .reveal {
          opacity: 0;
          transform: translateY(60px);
          transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.15s; }
        .reveal-delay-2 { transition-delay: 0.3s; }
        .reveal-delay-3 { transition-delay: 0.45s; }

        /* Hero text animation */
        @keyframes heroTextReveal {
          0% {
            opacity: 0;
            transform: translateY(100px) rotateX(30deg);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotateX(0);
            filter: blur(0);
          }
        }

        .hero-text-line {
          animation: heroTextReveal 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-text-line-1 { animation-delay: 0.3s; }
        .hero-text-line-2 { animation-delay: 0.5s; }
        .hero-text-line-3 { animation-delay: 0.7s; }

        /* Fallback for reduced motion or animation issues */
        @media (prefers-reduced-motion: reduce) {
          .hero-text-line, .reveal, .scale-in {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
            transition: none !important;
          }
        }

        /* Glowing text effect */
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(255,255,255,0.1); }
          50% { text-shadow: 0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.2); }
        }

        .glow-text {
          animation: glow 3s ease-in-out infinite;
        }

        /* Floating animation */
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(2deg); }
          50% { transform: translateY(-10px) rotate(-1deg); }
          75% { transform: translateY(-25px) rotate(1deg); }
        }

        .float { animation: float 8s ease-in-out infinite; }
        .float-delay-1 { animation-delay: -2s; }
        .float-delay-2 { animation-delay: -4s; }
        .float-delay-3 { animation-delay: -6s; }

        /* Pulse ring */
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }

        .pulse-ring {
          animation: pulseRing 4s ease-in-out infinite;
        }

        /* Gradient border animation */
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .gradient-border {
          background: linear-gradient(90deg, #fff, #666, #fff, #666);
          background-size: 300% 100%;
          animation: gradientMove 4s linear infinite;
        }

        /* Card hover effect */
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-3d:hover {
          transform: perspective(1000px) rotateX(5deg) rotateY(-5deg) translateZ(20px);
        }

        /* Shimmer effect */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        /* Scale in animation */
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .scale-in {
          animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Magnetic button effect */
        .magnetic-btn {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .magnetic-btn:hover {
          transform: scale(1.05);
        }

        /* Underline animation */
        .animated-underline {
          position: relative;
        }

        .animated-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: white;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animated-underline:hover::after {
          width: 100%;
        }

        /* Ripple effect */
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(4); opacity: 0; }
        }

        /* Counter animation */
        @keyframes countUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .count-up {
          animation: countUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Morphing shape */
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; }
          75% { border-radius: 60% 40% 60% 30% / 60% 30% 60% 40%; }
        }

        .morph-shape {
          animation: morph 10s ease-in-out infinite;
        }

        /* Typing effect */
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .typing-cursor::after {
          content: '|';
          animation: blink 1s infinite;
        }

        /* Stagger children */
        .stagger-children > * {
          opacity: 0;
          animation: heroTextReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
        .stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
        .stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
        .stagger-children > *:nth-child(4) { animation-delay: 0.4s; }

        /* Noise texture overlay */
        .noise-overlay::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.03;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          z-index: 9999;
        }
      `}</style>

      {/* Particle canvas background */}
      <canvas id="particles" className="fixed inset-0 pointer-events-none z-0" />

      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-[5%] py-6 flex justify-between items-center bg-black/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="text-xl font-extrabold tracking-widest uppercase glow-text">ABC Studio</div>
        <ul className="hidden md:flex gap-12 list-none stagger-children">
          <li><a href="#about" className="animated-underline text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white transition-colors">About</a></li>
          <li><a href="#services" className="animated-underline text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white transition-colors">Services</a></li>
          <li><a href="#portfolio" className="animated-underline text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white transition-colors">Work</a></li>
          <li><a href="#why-us" className="animated-underline text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white transition-colors">Why Us</a></li>
          <li><a href="#contact" className="animated-underline text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white transition-colors">Contact</a></li>
        </ul>
        <button
          onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          className="hidden md:block magnetic-btn px-6 py-3 bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-gray-300 transition-all relative overflow-hidden group"
        >
          <span className="relative z-10">Get in Touch</span>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-1"
        >
          <span className={`block w-6 h-px bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
          <span className={`block w-6 h-px bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-px bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed top-[72px] left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800 md:hidden transition-all duration-500 ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="px-[5%] py-6 flex flex-col gap-4 stagger-children">
          <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white">About</a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white">Services</a>
          <a href="#portfolio" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white">Work</a>
          <a href="#why-us" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white">Why Us</a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-gray-400 text-sm font-medium tracking-wider uppercase hover:text-white">Contact</a>
        </div>
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="min-h-[100svh] flex items-center justify-center relative px-[5%] pt-24 sm:pt-32 pb-16 sm:pb-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(255,255,255,0.04)_0%,transparent_70%)]"></div>

        {/* Morphing gradient orbs */}
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] morph-shape bg-gradient-to-r from-purple-900/20 to-blue-900/20 blur-3xl float"
          style={{ transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)` }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] morph-shape bg-gradient-to-r from-blue-900/20 to-cyan-900/20 blur-3xl float float-delay-2"
          style={{ transform: `translate(${-mousePosition.x * 1.5}px, ${-mousePosition.y * 1.5}px)` }}
        />

        {/* Animated grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
        }}></div>

        {/* Glowing rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full pulse-ring" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/3 rounded-full pulse-ring" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white/2 rounded-full pulse-ring" style={{ animationDelay: '2s' }} />

        <div className="relative text-center max-w-4xl z-10">
          <div className="hero-text-line hero-text-line-1 inline-flex items-center gap-3 px-5 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest uppercase mb-12 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
            Since 2016 — AI & Data Engineering Studio
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight mb-6 sm:mb-8" style={{ perspective: '1000px' }}>
            <span className="hero-text-line hero-text-line-2 block glow-text">DATA DRIVES</span>
            <span
              className="hero-text-line hero-text-line-3 block"
              style={{
                WebkitTextStroke: '2px white',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.2))'
              }}
            >
              TOMORROW
            </span>
          </h1>
          <p className="hero-text-line hero-text-line-3 text-gray-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-10 sm:mb-14 leading-relaxed px-4 sm:px-0" style={{ fontFamily: "'Space Mono', monospace" }}>
            From global big data to cutting-edge generative AI content. We engineer the future of data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center scale-in" style={{ animationDelay: '1s' }}>
            <a
              href="#contact"
              className="magnetic-btn inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-semibold text-sm tracking-wider uppercase hover:bg-gray-300 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] relative overflow-hidden group"
            >
              <span className="relative z-10">Start a Project</span>
              <svg className="relative z-10 group-hover:translate-x-1 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              <div className="absolute inset-0 shimmer" />
            </a>
            <a
              href="#services"
              className="magnetic-btn inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-transparent border border-gray-700 text-white font-medium text-sm tracking-wider uppercase hover:bg-gray-900 hover:border-gray-500 transition-all group"
            >
              Explore Services
              <svg className="group-hover:translate-y-1 transition-transform" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-gray-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-[5%] py-16 sm:py-24 lg:py-36 border-t border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-start relative z-10">
          <div className="reveal">
            <span className="text-gray-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
              <span className="text-white mr-4 font-bold">01</span>About
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mt-4 sm:mt-6 glow-text">
              AI & Data Engineering Studio
            </h2>
          </div>
          <p className="text-gray-400 text-sm sm:text-base leading-loose reveal reveal-delay-1" style={{ fontFamily: "'Space Mono', monospace" }}>
            ABC Studio specializes in AI and big data engineering. Leveraging top-tier talent from Vietnam, we deliver cost-effective, high-quality services across data collection, AI model training, and content production.
          </p>
        </div>

        <div className="max-w-6xl mx-auto mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-800 reveal reveal-delay-2">
          {[
            { number: '2016', label: 'Founded' },
            { number: '50+', label: 'Projects Delivered' },
            { number: '100+', label: 'Engineers' },
            { number: '5+', label: 'Global Markets' }
          ].map((stat, idx) => (
            <div key={idx} className="card-3d bg-black p-6 sm:p-8 lg:p-12 text-center hover:bg-gray-900 transition-all duration-500 group">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-1 sm:mb-2 group-hover:scale-110 transition-transform glow-text">{stat.number}</div>
              <div className="text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Company Introduction Download Section */}
      <section className="px-[5%] py-16 sm:py-24 lg:py-32 border-t border-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(120,119,198,0.08)_0%,transparent_70%)]" />

        <div className="max-w-4xl mx-auto relative z-10 text-center reveal">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 sm:mb-6 glow-text">
            회사소개서 다운로드
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8 sm:mb-12" style={{ fontFamily: "'Space Mono', monospace" }}>
            ABC Studio의 서비스와 역량을 한눈에 확인하세요
          </p>
          <a
            href="https://drive.google.com/file/d/1-9rHzbUvJ0AcPovYFWVtTTA__m2OquiR/view"
            target="_blank"
            rel="noopener noreferrer"
            className="magnetic-btn inline-flex items-center justify-center gap-4 px-10 sm:px-16 py-5 sm:py-6 bg-white text-black font-semibold text-sm sm:text-base tracking-wider uppercase hover:bg-gray-300 transition-all shadow-[0_0_60px_rgba(255,255,255,0.3)] relative overflow-hidden group"
          >
            <svg className="relative z-10 w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            <span className="relative z-10">회사소개서 보기</span>
            <div className="absolute inset-0 shimmer" />
          </a>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="px-[5%] py-16 sm:py-24 lg:py-36 border-t border-gray-800 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="reveal mb-10 sm:mb-16 lg:mb-20">
            <span className="text-gray-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
              <span className="text-white mr-4 font-bold">02</span>Services
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mt-4 sm:mt-6 glow-text">What We Do</h2>
          </div>

          <div className="border-t border-gray-800">
            {[
              {
                num: '01',
                title: 'Global Market Data Engineering',
                desc: 'Collect, refine, and visualize big data from global e-commerce and social platforms including Coupang, Shopee, TikTok, Xiaohongshu, and Douyin. Build interactive dashboards for real-time market insights.',
                tags: ['E-commerce', 'SNS Analytics', 'Dashboard']
              },
              {
                num: '02',
                title: 'Vision AI & Data Training',
                desc: 'Data mining, annotation, augmentation, and synthetic data production using 3D and Gen-AI. Pre-training and fine-tuning of state-of-the-art models including YOLO, DETR, and ResNet.',
                tags: ['Annotation', 'Synthetic Data', 'Model Training']
              },
              {
                num: '03',
                title: 'Generative AI Content Production',
                desc: 'AI webtoon dramas, VFX AI compositing, 3D SNS content (FOOH), LLM/RAG engineering, and VLM-based influencer analysis. Cutting-edge generative AI services for next-gen content.',
                tags: ['AI Webtoon', 'VFX AI', 'LLM/RAG']
              },
              {
                num: '04',
                title: 'Integrated AI & Data Engineering',
                desc: 'End-to-end solutions covering bulk data collection, annotation, refinement, generation, AI model training, and AI content production — all under one roof.',
                tags: ['End-to-End', 'Data Pipeline', 'AI Integration']
              }
            ].map((service, idx) => (
              <div key={idx} className={`reveal ${idx > 0 ? `reveal-delay-${idx}` : ''} grid grid-cols-1 md:grid-cols-[80px_1fr_1fr] gap-4 sm:gap-6 md:gap-8 py-8 sm:py-10 md:py-12 border-b border-gray-800 items-start group cursor-pointer transition-all duration-500 md:hover:pl-8 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent`}>
                <span className="text-gray-500 text-sm hidden md:block group-hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{service.num}</span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight group-hover:text-white transition-colors">{service.title}</h3>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm leading-loose mb-4 sm:mb-6 group-hover:text-gray-300 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{service.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag, i) => (
                      <span key={i} className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-800 text-gray-500 text-[10px] sm:text-xs tracking-wider uppercase group-hover:border-gray-600 group-hover:text-gray-400 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="px-[5%] py-16 sm:py-24 lg:py-36 border-t border-gray-800 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-blue-900/5 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="reveal mb-10 sm:mb-16 lg:mb-20">
            <span className="text-gray-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
              <span className="text-white mr-4 font-bold">03</span>Work
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mt-4 sm:mt-6 glow-text">Selected Projects</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-800">
            {[
              { category: 'LLM', title: 'International Travel Safety Information Chatbot', date: 'Aug 2024 — Mar 2025' },
              { category: 'Vision AI', title: 'Smart Intersection Traffic System', date: 'Nov 2024 — Apr 2025' },
              { category: 'Global Market', title: 'Xiaohongshu & Douyin Influencer Big Data Analysis', date: 'Oct 2024 — Present' },
              { category: 'Data Analytics', title: 'Southeast Asia Beauty Market Insight Dashboard', date: 'Jan 2024 — Present' },
              { category: 'Gen-AI', title: 'Webtoon-Based Short-Form AI Drama Production', date: 'Dec 2024 — Present' },
              { category: 'Gen-AI', title: "SPC Samlip Gen-AI Product Development Platform 'SGPD'", date: '2023' }
            ].map((project, idx) => (
              <div key={idx} className={`reveal ${idx > 0 ? `reveal-delay-${Math.min(idx, 3)}` : ''} card-3d bg-black p-6 sm:p-8 lg:p-10 min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] flex flex-col group cursor-pointer relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase pb-4 sm:pb-6 border-b border-gray-800 mb-4 sm:mb-6 group-hover:text-white group-hover:border-gray-600 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{project.category}</span>
                <h3 className="relative z-10 text-base sm:text-lg lg:text-xl font-semibold tracking-tight leading-snug flex-grow group-hover:text-white transition-colors">{project.title}</h3>
                <span className="relative z-10 text-gray-500 text-[10px] sm:text-xs mt-6 sm:mt-8 group-hover:text-gray-400 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{project.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section id="why-us" className="px-[5%] py-16 sm:py-24 lg:py-36 border-t border-gray-800 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="reveal mb-10 sm:mb-16 lg:mb-20">
            <span className="text-gray-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
              <span className="text-white mr-4 font-bold">04</span>Why Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mt-4 sm:mt-6 glow-text">Why ABC Studio?</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-gray-800">
            {[
              { num: '01', title: 'Cost-Effective Excellence', desc: "Access top-tier AI engineers from Vietnam at competitive rates. We deliver premium quality without the premium price tag, maximizing your ROI on every project." },
              { num: '02', title: 'End-to-End Solutions', desc: "From data collection to model training to content production — we handle the entire pipeline. One partner, complete solutions, seamless execution." },
              { num: '03', title: 'Deep Tech Expertise', desc: "LLM, Vision AI, VFX AI — we stay at the forefront of deep learning technology. Our team brings cutting-edge expertise to every engagement." }
            ].map((feature, idx) => (
              <div key={idx} className={`reveal ${idx > 0 ? `reveal-delay-${idx}` : ''} card-3d bg-[#0a0a0a] p-8 sm:p-12 lg:p-16 group cursor-pointer relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 text-gray-500 text-xs mb-4 sm:mb-6 lg:mb-8 block group-hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{feature.num}</span>
                <h3 className="relative z-10 text-xl sm:text-2xl font-bold tracking-tight mb-4 sm:mb-6 group-hover:text-white transition-colors">{feature.title}</h3>
                <p className="relative z-10 text-gray-400 text-xs sm:text-sm leading-loose group-hover:text-gray-300 transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-[5%] py-16 sm:py-24 lg:py-36 border-t border-gray-800 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="reveal mb-10 sm:mb-16 lg:mb-20">
            <span className="text-gray-500 text-xs tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
              <span className="text-white mr-4 font-bold">05</span>Contact
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mt-4 sm:mt-6 glow-text">Let's Build Together</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            <div className="reveal">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 sm:mb-8">Start a Conversation</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-loose mb-8 sm:mb-12" style={{ fontFamily: "'Space Mono', monospace" }}>
                Ready to transform your data into actionable insights? Let's discuss how ABC Studio can help bring your vision to life.
              </p>
              <div style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs sm:text-sm">
                <p><a href="mailto:contact@abcstudio.com" className="text-white hover:text-gray-400 transition-colors animated-underline">contact@abcstudio.com</a></p>
                <p className="text-gray-500 mt-2">Seoul, Korea / Vietnam</p>
              </div>
            </div>

            {submitted ? (
              <div className="reveal reveal-delay-1 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 sm:p-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-green-500 text-5xl sm:text-6xl mb-4 sm:mb-6 animate-bounce">✓</div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 glow-text">Thank you for your inquiry</h3>
                  <p className="text-gray-400 text-xs sm:text-sm" style={{ fontFamily: "'Space Mono', monospace" }}>We will get back to you soon.</p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-400 hover:text-white underline transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="reveal reveal-delay-1 bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-6 sm:p-8 lg:p-12 relative overflow-hidden">
                <div className="absolute inset-0 shimmer opacity-30" />
                <div className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-black/50 border border-gray-800 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm focus:border-white focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                        placeholder="Your company"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full bg-black/50 border border-gray-800 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm focus:border-white focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full bg-black/50 border border-gray-800 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm focus:border-white focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                        placeholder="you@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-black/50 border border-gray-800 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm focus:border-white focus:outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                        placeholder="+1 (000) 000-0000"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Service Interest</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full bg-black/50 border border-gray-800 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm focus:border-white focus:outline-none transition-all duration-300 appearance-none cursor-pointer focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1rem'
                      }}
                    >
                      <option value="">Select a service</option>
                      <option value="market-data">Global Market Data Engineering</option>
                      <option value="vision-ai">Vision AI & Data Training</option>
                      <option value="gen-ai">Generative AI Content Production</option>
                      <option value="integrated">Integrated AI & Data Engineering</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="mb-4 sm:mb-6">
                    <label className="block text-gray-500 text-[10px] sm:text-xs tracking-widest uppercase mb-2 sm:mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>Project Overview</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={4}
                      className="w-full bg-black/50 border border-gray-800 px-3 sm:px-4 py-3 sm:py-4 text-white text-sm focus:border-white focus:outline-none transition-all duration-300 resize-y focus:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                      placeholder="Tell us about your project..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="magnetic-btn w-full bg-white text-black py-4 sm:py-5 font-semibold text-xs sm:text-sm tracking-widest uppercase hover:bg-gray-300 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed relative overflow-hidden group"
                  >
                    <span className="relative z-10">{loading ? 'Sending...' : 'Send Message'}</span>
                    <div className="absolute inset-0 shimmer" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-[5%] py-10 sm:py-16 border-t border-gray-800 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="text-sm sm:text-base font-extrabold tracking-widest uppercase glow-text">ABC Studio</div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 stagger-children">
            <a href="#about" className="animated-underline text-gray-500 text-[10px] sm:text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>About</a>
            <a href="#services" className="animated-underline text-gray-500 text-[10px] sm:text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>Services</a>
            <a href="#portfolio" className="animated-underline text-gray-500 text-[10px] sm:text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>Work</a>
            <a href="#contact" className="animated-underline text-gray-500 text-[10px] sm:text-xs tracking-wider uppercase hover:text-white transition-colors" style={{ fontFamily: "'Space Mono', monospace" }}>Contact</a>
          </div>
          <div className="text-gray-500 text-[10px] sm:text-xs text-center" style={{ fontFamily: "'Space Mono', monospace" }}>© 2025 ABC Studio. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
