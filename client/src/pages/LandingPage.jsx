import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

export default function LandingPage() {
  const cursorRef = useRef(null);
  const ringRef = useRef(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!cursor || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;

    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.transform = `translate(${mx - 5}px, ${my - 5}px)`;
    };

    const animateRing = () => {
      rx += (mx - rx - 18) * 0.12;
      ry += (my - ry - 18) * 0.12;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(animateRing);
    };

    document.addEventListener("mousemove", handleMouseMove);
    const frameId = requestAnimationFrame(animateRing);

    // Hover effects on links
    const links = document.querySelectorAll("a, button");
    const onEnter = () => {
      ring.style.width = "56px";
      ring.style.height = "56px";
    };
    const onLeave = () => {
      ring.style.width = "36px";
      ring.style.height = "36px";
    };
    links.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
      links.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <style>{`
        body { cursor: none; }
        .cursor {
          width: 10px; height: 10px;
          background: #00FF94;
          border-radius: 50%;
          position: fixed;
          top: 0; left: 0;
          pointer-events: none;
          z-index: 9999;
          transition: transform 0.1s ease;
          mix-blend-mode: screen;
        }
        .cursor-ring {
          width: 36px; height: 36px;
          border: 1px solid rgba(0,255,148,0.4);
          border-radius: 50%;
          position: fixed;
          top: 0; left: 0;
          pointer-events: none;
          z-index: 9998;
          transition: transform 0.15s ease, width 0.2s, height 0.2s;
        }
        .landing-grid::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,255,148,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,148,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .animate-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .hero-anim-badge { animation: fadeDown 0.6s ease both; }
        .hero-anim-h1 { animation: fadeUp 0.7s 0.1s ease both; }
        .hero-anim-sub { animation: fadeUp 0.7s 0.2s ease both; }
        .hero-anim-actions { animation: fadeUp 0.7s 0.3s ease both; }
        .hero-anim-terminal { animation: fadeUp 0.8s 0.4s ease both; }
        .blink-cursor { animation: blink 1s infinite; color: #00FF94; }
        .pulse-dot { animation: pulse-dot 2s infinite; }
        .pulse-1-5 { animation: pulse-dot 1.5s infinite; }
      `}</style>

      <div ref={cursorRef} className="cursor" />
      <div ref={ringRef} className="cursor-ring" />

      <div className="landing-grid" style={{ background: '#080C10', color: '#E8EDF2', fontFamily: "'Instrument Sans', sans-serif", overflowX: 'hidden' }}>
        {/* NAV */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '20px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,16,0.8)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1E2D3D'
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="pulse-dot" style={{ width: 8, height: 8, background: '#00FF94', borderRadius: '50%' }} />
            DevPulse
          </div>
          <ul style={{ display: 'flex', gap: 36, listStyle: 'none' }}>
            {['Features', 'How it works', 'Stack', 'Compare'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase().replace(/ /g, '')}`}
                  style={{ color: '#6B7D8F', textDecoration: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.3px', transition: 'color 0.2s' }}
                  onMouseOver={(e) => e.target.style.color = '#E8EDF2'}
                  onMouseOut={(e) => e.target.style.color = '#6B7D8F'}
                >{item}</a>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }} ref={profileRef}>
            {!user ? (
              <>
                <Link to="/login" style={{
                  color: '#E8EDF2', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s'
                }}>Sign in</Link>
                <Link to="/register" style={{
                  background: '#00FF94', color: '#000', padding: '10px 24px', borderRadius: 6,
                  fontWeight: 600, fontSize: 14, textDecoration: 'none', letterSpacing: '0.3px', transition: 'all 0.2s'
                }}>Get Started Free →</Link>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#111820', 
                    border: '1px solid #1E2D3D', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', color: '#00FF94', fontFamily: "'Syne', sans-serif",
                    fontWeight: 700, cursor: 'pointer', transition: 'border-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#00FF94'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = '#1E2D3D'}
                >
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </button>
                
                {profileOpen && (
                  <div style={{
                    position: 'absolute', top: 56, right: 0, width: 200, background: '#111820',
                    border: '1px solid #1E2D3D', borderRadius: 8, padding: '8px 0',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 101
                  }}>
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid #1E2D3D', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EDF2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7D8F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                    <Link to="/dashboard" style={{
                      display: 'block', padding: '10px 16px', color: '#E8EDF2', textDecoration: 'none',
                      fontSize: 14, transition: 'background 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.background = '#080C10'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      Dashboard
                    </Link>
                    <button onClick={() => { logout(); setProfileOpen(false); }} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', 
                      color: '#FF6B35', textDecoration: 'none', fontSize: 14, background: 'transparent',
                      border: 'none', cursor: 'pointer', transition: 'background 0.2s'
                    }} onMouseOver={e => e.currentTarget.style.background = '#080C10'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                      Sign out
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>

        {/* HERO */}
        <section style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: '120px 40px 80px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', width: 800, height: 800,
            background: 'radial-gradient(circle, rgba(0,255,148,0.06) 0%, transparent 70%)',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(0,194,255,0.04) 0%, transparent 70%)',
            top: '30%', left: '20%', pointerEvents: 'none'
          }} />

          <div className="hero-anim-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.2)',
            padding: '6px 16px', borderRadius: 100, fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace", color: '#00FF94', marginBottom: 32
          }}>
            <div className="pulse-1-5" style={{ width: 6, height: 6, background: '#00FF94', borderRadius: '50%' }} />
            AI-Powered · 100% Free · Open Source
          </div>

          <h1 className="hero-anim-h1" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(48px, 7vw, 96px)',
            fontWeight: 800, lineHeight: 1.0, letterSpacing: '-3px', maxWidth: 900, marginBottom: 28
          }}>
            The <span style={{ color: '#00FF94' }}>second brain</span><br />
            for your <span style={{ color: '#00C2FF' }}>engineering</span> team
          </h1>

          <p className="hero-anim-sub" style={{
            fontSize: 18, color: '#6B7D8F', maxWidth: 560, lineHeight: 1.7, marginBottom: 48
          }}>
            Connect your GitHub repo. Ask questions about your codebase.
            Get AI summaries of every commit. Understand any bug instantly.
            Built for teams who ship fast.
          </p>

          <div className="hero-anim-actions" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link to="/register" style={{
              background: '#00FF94', color: '#000', padding: '14px 32px', borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex',
              alignItems: 'center', gap: 8, transition: 'all 0.2s'
            }}>
              Start for Free <span>→</span>
            </Link>
            <a href="#features" style={{
              color: '#6B7D8F', padding: '14px 24px', borderRadius: 8, fontSize: 15,
              textDecoration: 'none', border: '1px solid #1E2D3D', display: 'flex',
              alignItems: 'center', gap: 8, transition: 'all 0.2s'
            }}>
              <span>▶</span> Watch Demo
            </a>
          </div>

          {/* Terminal mockup */}
          <div className="hero-anim-terminal" style={{ marginTop: 80, width: '100%', maxWidth: 800, position: 'relative' }}>
            <div style={{
              background: '#0D1117', border: '1px solid #1E2D3D', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,148,0.05)'
            }}>
              <div style={{
                background: '#111820', padding: '12px 20px', display: 'flex',
                alignItems: 'center', gap: 8, borderBottom: '1px solid #1E2D3D'
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6B7D8F', marginLeft: 8 }}>
                  devpulse — AI codebase chat
                </span>
              </div>
              <div style={{
                padding: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                lineHeight: 1.8, textAlign: 'left'
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#00FF94', flexShrink: 0 }}>❯</span>
                  <span style={{ color: '#E8EDF2' }}>connect github.com/myteam/backend-api</span>
                </div>
                <div style={{ color: '#00FF94', paddingLeft: 24 }}>✓ Repo indexed. 2,847 chunks embedded in 12s</div>
                <br />
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#00FF94', flexShrink: 0 }}>you</span>
                  <span style={{ color: '#E8EDF2' }}>How does authentication work in this codebase?</span>
                </div>
                <div style={{ color: '#6B7D8F', paddingLeft: 24 }}>
                  <span style={{ color: '#00C2FF' }}>DevPulse:</span> Authentication uses JWT tokens with a 15-minute
                  expiry. Found in <span style={{ color: '#00FF94' }}>src/middleware/auth.ts</span>. Refresh tokens
                  are stored in <span style={{ color: '#00FF94' }}>Redis</span> with a 7-day TTL.
                  The flow starts in <span style={{ color: '#00FF94' }}>routes/auth.ts:L24</span><span className="blink-cursor">█</span>
                </div>
                <br />
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#00FF94', flexShrink: 0 }}>you</span>
                  <span style={{ color: '#E8EDF2' }}>Latest commit broke the payment flow. Fix?</span>
                </div>
                <div style={{ color: '#6B7D8F', paddingLeft: 24 }}>
                  <span style={{ color: '#FF6B35' }}>⚠ Found in commit a3f2c1:</span> Stripe webhook handler in
                  <span style={{ color: '#00FF94' }}> services/payment.ts:L89</span> missing await keyword.
                  Async race condition. Fix: add <span style={{ color: '#00C2FF' }}>await processWebhook(event)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div style={{
          padding: 60, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: '#1E2D3D', borderTop: '1px solid #1E2D3D', borderBottom: '1px solid #1E2D3D'
        }}>
          {[
            { num: '26M+', label: 'GitHub developers' },
            { num: '$0', label: 'Forever free for small teams' },
            { num: '<2s', label: 'Avg. AI response time' },
            { num: '100%', label: 'Your code stays private' },
          ].map((stat) => (
            <div key={stat.label} className="animate-on-scroll" style={{ background: '#080C10', padding: 40, textAlign: 'center' }}>
              <span style={{
                fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800,
                color: '#00FF94', letterSpacing: '-2px', display: 'block'
              }}>{stat.num}</span>
              <span style={{ color: '#6B7D8F', fontSize: 13, marginTop: 6, letterSpacing: '0.5px' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <section id="features" style={{ padding: '120px 60px', position: 'relative' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00FF94',
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            Features
            <span style={{ flex: 1, height: 1, background: '#1E2D3D' }} />
          </div>
          <h2 className="animate-on-scroll" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)',
            fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 600, marginBottom: 16
          }}>
            Everything your team needs. Nothing it doesn't.
          </h2>
          <p className="animate-on-scroll" style={{ color: '#6B7D8F', fontSize: 16, maxWidth: 500, lineHeight: 1.7, marginBottom: 64 }}>
            Six powerful features that turn your codebase from a mystery into a conversation.
          </p>

          <div className="animate-on-scroll" style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
            background: '#1E2D3D', border: '1px solid #1E2D3D', borderRadius: 16, overflow: 'hidden'
          }}>
            {[
              { icon: '🧠', num: '01', title: 'Codebase Q&A', desc: 'Ask anything about your repo in plain English. Get answers with exact file paths and line numbers — powered by RAG over your actual code.' },
              { icon: '⚡', num: '02', title: 'Live Commit Feed', desc: 'Every push is instantly summarized in plain English. No more reading raw diffs. Your whole team stays in sync automatically.' },
              { icon: '🐛', num: '03', title: 'Bug Assistant', desc: 'Paste any error or stack trace. AI finds the exact file and line causing it, explains why, and suggests a fix using your own codebase.' },
              { icon: '📋', num: '04', title: 'PR Summarizer', desc: 'Non-technical teammates finally understand what\'s shipping. Auto-generate plain English PR summaries with risk assessments.' },
              { icon: '👥', num: '05', title: 'Team Workspace', desc: 'Shared chat history, file annotations, and real-time presence. Everyone works from the same context, even across timezones.' },
              { icon: '📚', num: '06', title: 'Auto Documentation', desc: 'Connect a repo and get instant AI-generated docs for every function, class, and module. Always in sync with your latest code.' },
            ].map((feature) => (
              <div key={feature.num} style={{
                background: '#0F1923', padding: 40, transition: 'background 0.2s', position: 'relative', overflow: 'hidden'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#111820'}
              onMouseOut={(e) => e.currentTarget.style.background = '#0F1923'}
              >
                <div style={{
                  width: 44, height: 44, background: 'rgba(0,255,148,0.08)',
                  border: '1px solid rgba(0,255,148,0.15)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginBottom: 20
                }}>{feature.icon}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6B7D8F', marginBottom: 12, letterSpacing: 1 }}>{feature.num}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.3px' }}>{feature.title}</div>
                <div style={{ color: '#6B7D8F', fontSize: 14, lineHeight: 1.7 }}>{feature.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="howitworks" style={{
          padding: '120px 60px', background: '#0D1117',
          borderTop: '1px solid #1E2D3D', borderBottom: '1px solid #1E2D3D'
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00FF94',
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            How it works
            <span style={{ flex: 1, height: 1, background: '#1E2D3D' }} />
          </div>
          <h2 className="animate-on-scroll" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)',
            fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 600
          }}>
            From zero to AI-powered in 60 seconds
          </h2>

          <div className="animate-on-scroll" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            marginTop: 64, position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: 28, left: '10%', right: '10%',
              height: 1, background: 'linear-gradient(90deg, transparent, #1E2D3D, #1E2D3D, transparent)'
            }} />
            {[
              { num: '01', title: 'Connect Repo', desc: 'Paste your GitHub URL. DevPulse fetches and indexes every file automatically.' },
              { num: '02', title: 'AI Indexes Code', desc: 'Your codebase is chunked, embedded, and stored in a vector database in seconds.' },
              { num: '03', title: 'Ask Anything', desc: 'Chat with your codebase. Get answers grounded in your actual files, not hallucinations.' },
              { num: '04', title: 'Team Syncs', desc: 'Invite teammates. Everyone shares context, commit updates, and AI history.' },
            ].map((step) => (
              <div key={step.num} style={{ padding: '0 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', border: '1px solid #1E2D3D',
                  background: '#080C10', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#00FF94',
                  margin: '0 auto 24px', position: 'relative', zIndex: 1
                }}>{step.num}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{step.title}</div>
                <div style={{ color: '#6B7D8F', fontSize: 13, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TECH STACK */}
        <section id="stack" style={{ padding: '120px 60px' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00FF94',
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            Tech Stack
            <span style={{ flex: 1, height: 1, background: '#1E2D3D' }} />
          </div>
          <h2 className="animate-on-scroll" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)',
            fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 600, marginBottom: 16
          }}>Built on tools that scale</h2>
          <p className="animate-on-scroll" style={{ color: '#6B7D8F', fontSize: 16, maxWidth: 500, lineHeight: 1.7, marginBottom: 48 }}>
            100% free, open source stack. No vendor lock-in. Deploy anywhere.
          </p>

          <div className="animate-on-scroll" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 48 }}>
            {[
              'React 18 + Vite', 'TypeScript', 'Node.js + Express', 'MongoDB Atlas',
              'Atlas Vector Search', 'Groq (Llama 3.1 70B)', 'Hugging Face Embeddings',
              'LangChain.js', 'Socket.io', 'BullMQ + Redis', 'Upstash Redis',
              'Tailwind CSS', 'shadcn/ui', 'Monaco Editor', 'Zustand',
              'TanStack Query', 'Octokit', 'Docker + Compose', 'JWT Auth', 'Vercel + Railway'
            ].map((tech) => (
              <div key={tech} style={{
                background: '#0F1923', border: '1px solid #1E2D3D', padding: '10px 20px',
                borderRadius: 100, fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                color: '#6B7D8F', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#00FF94'; e.currentTarget.style.color = '#00FF94'; e.currentTarget.style.background = 'rgba(0,255,148,0.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#1E2D3D'; e.currentTarget.style.color = '#6B7D8F'; e.currentTarget.style.background = '#0F1923'; }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF94', opacity: 0.5 }} />
                {tech}
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON */}
        <section id="compare" style={{
          padding: '120px 60px', background: '#0D1117',
          borderTop: '1px solid #1E2D3D'
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#00FF94',
            letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            Comparison
            <span style={{ flex: 1, height: 1, background: '#1E2D3D' }} />
          </div>
          <h2 className="animate-on-scroll" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)',
            fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 600, marginBottom: 16
          }}>Why DevPulse wins</h2>
          <p className="animate-on-scroll" style={{ color: '#6B7D8F', fontSize: 16, maxWidth: 500, lineHeight: 1.7, marginBottom: 48 }}>
            No other tool combines all of this. Especially not for free.
          </p>

          <div className="animate-on-scroll" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #1E2D3D', borderRadius: 12, overflow: 'hidden' }}>
              <thead>
                <tr>
                  {['Feature', 'DevPulse ✦', 'Greptile', 'Cursor', 'Swimm', 'Linear'].map((h, i) => (
                    <th key={h} style={{
                      background: i === 1 ? 'rgba(0,255,148,0.05)' : '#111820',
                      padding: '16px 24px', textAlign: 'left',
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
                      color: i === 1 ? '#00FF94' : '#6B7D8F', letterSpacing: 1,
                      borderBottom: '1px solid #1E2D3D'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Codebase Q&A (RAG)', '✓', '✓', '~', '✗', '✗'],
                  ['AI Commit Summaries', '✓', '✗', '✗', '✗', '✗'],
                  ['Bug Assistant', '✓', '✗', '~', '✗', '✗'],
                  ['PR Summarizer', '✓', '✗', '✗', '✗', '~'],
                  ['Team Collaboration', '✓', '✗', '✗', '✓', '✓'],
                  ['Auto Documentation', '✓', '✗', '✗', '✓', '✗'],
                  ['Free for small teams', '✓', '✗', '~', '✗', '~'],
                ].map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{
                        padding: '16px 24px',
                        borderBottom: ri < 6 ? '1px solid rgba(30,45,61,0.5)' : 'none',
                        fontSize: 14,
                        color: ci === 0 ? '#E8EDF2' : '#6B7D8F',
                        fontWeight: ci === 0 ? 500 : 400,
                        background: ci === 1 ? 'rgba(0,255,148,0.03)' : 'transparent'
                      }}>
                        {ci > 0 ? (
                          <span style={{
                            color: cell === '✓' ? '#00FF94' : cell === '✗' ? '#FF4444' : '#FF6B35',
                            fontSize: 16
                          }}>{cell}</span>
                        ) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section style={{
          padding: '120px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          background: '#0D1117', borderTop: '1px solid #1E2D3D'
        }}>
          <div style={{
            position: 'absolute', width: 600, height: 300,
            background: 'radial-gradient(ellipse, rgba(0,255,148,0.08) 0%, transparent 70%)',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
          }} />
          <h2 className="animate-on-scroll" style={{
            fontFamily: "'Syne', sans-serif", fontSize: 'clamp(40px, 5vw, 72px)',
            fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 24, position: 'relative'
          }}>
            Your codebase.<br />
            <span style={{ color: '#00FF94' }}>Finally understood.</span>
          </h2>
          <p className="animate-on-scroll" style={{ color: '#6B7D8F', fontSize: 16, marginBottom: 48, position: 'relative' }}>
            Free forever for teams under 5. No credit card. No nonsense.
          </p>
          <div className="animate-on-scroll" style={{ display: 'flex', gap: 16, justifyContent: 'center', position: 'relative' }}>
            <Link to="/register" style={{
              background: '#00FF94', color: '#000', padding: '14px 32px', borderRadius: 8,
              fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex',
              alignItems: 'center', gap: 8
            }}>Connect GitHub Repo →</Link>
            <a href="#features" style={{
              color: '#6B7D8F', padding: '14px 24px', borderRadius: 8, fontSize: 15,
              textDecoration: 'none', border: '1px solid #1E2D3D', display: 'flex',
              alignItems: 'center', gap: 8
            }}>Read the Docs</a>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          padding: '40px 60px', borderTop: '1px solid #1E2D3D',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="pulse-dot" style={{ width: 8, height: 8, background: '#00FF94', borderRadius: '50%' }} />
            DevPulse
          </div>
          <div style={{ color: '#6B7D8F', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>
            © 2025 DevPulse. Built with ♥ and Llama 3.1
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['GitHub', 'Docs', 'Twitter', 'Discord'].map((link) => (
              <a key={link} href="#" style={{ color: '#6B7D8F', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s' }}
                onMouseOver={(e) => e.target.style.color = '#E8EDF2'}
                onMouseOut={(e) => e.target.style.color = '#6B7D8F'}
              >{link}</a>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
