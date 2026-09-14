import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Asterisk,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Menu,
  MousePointer2,
  Play,
  Sparkles,
  X,
} from 'lucide-react'

type Course = {
  id: string
  number: string
  title: string
  description: string
  lessons: number
  duration: string
  accent: string
  icon: string
}

type LearningStep = {
  number: string
  title: string
  description: string
}

const courses: Course[] = [
  {
    id: 'html',
    number: '01',
    title: 'Build with HTML',
    description: 'Give every page a strong foundation with headings, links, images, and structure.',
    lessons: 12,
    duration: '2.5 hours',
    accent: 'coral',
    icon: '< >',
  },
  {
    id: 'css',
    number: '02',
    title: 'Style with CSS',
    description: 'Turn plain pages into expressive layouts with color, type, spacing, and responsive design.',
    lessons: 14,
    duration: '3 hours',
    accent: 'yellow',
    icon: '{ }',
  },
  {
    id: 'javascript',
    number: '03',
    title: 'Think in JavaScript',
    description: 'Make the web react, remember, and respond with your first real programming language.',
    lessons: 18,
    duration: '4 hours',
    accent: 'green',
    icon: '( )',
  },
]

const learningSteps: LearningStep[] = [
  {
    number: '01',
    title: 'Learn one small idea',
    description: 'Clear explanations, no jargon pile-ups, and examples you can actually picture.',
  },
  {
    number: '02',
    title: 'Try it right away',
    description: 'Short challenges help the concept stick before you move on to the next one.',
  },
  {
    number: '03',
    title: 'Make something yours',
    description: 'Every path ends with a personal project you will be genuinely excited to share.',
  },
]

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false)
    window.addEventListener('resize', closeMenu)
    return () => window.removeEventListener('resize', closeMenu)
  }, [])

  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="CodeBloom home">
        <span className="brand-mark" aria-hidden="true"><Asterisk /></span>
        CodeBloom
      </a>
      <button
        className="menu-button"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>
      <nav id="primary-navigation" className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Primary navigation">
        <a href="#courses" onClick={() => setMenuOpen(false)}>Courses</a>
        <a href="#method" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#stories" onClick={() => setMenuOpen(false)}>Stories</a>
        <a className="nav-cta" href="#courses" onClick={() => setMenuOpen(false)}>Start learning <ArrowRight size={17} /></a>
      </nav>
    </header>
  )
}

function CodeCard() {
  return (
    <div className="code-visual" aria-label="Example HTML code that creates a Hello, world heading">
      <div className="code-toolbar" aria-hidden="true">
        <span className="window-dots"><i /><i /><i /></span>
        <span>hello-world.html</span>
        <Code2 size={17} />
      </div>
      <div className="code-body">
        <div><span className="line-number">1</span><span className="tag">&lt;h1&gt;</span></div>
        <div className="code-indent"><span className="line-number">2</span><span className="code-copy">Hello, world!</span><span className="cursor" /></div>
        <div><span className="line-number">3</span><span className="tag">&lt;/h1&gt;</span></div>
      </div>
      <div className="result-card">
        <span>YOUR FIRST RESULT</span>
        <strong>Hello, world!</strong>
        <Sparkles className="result-spark" aria-hidden="true" />
      </div>
      <div className="scribble scribble-one" aria-hidden="true">you made this!</div>
    </div>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span>✦</span> A gentler way to learn code</div>
        <h1>Start small.<br />Build <em>brave.</em></h1>
        <p>Friendly, bite-sized lessons that turn “I could never code” into “wait—I made that?”</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#courses">Explore free courses <ArrowRight /></a>
          <a className="text-link" href="#method"><Play size={15} fill="currentColor" /> See how it works</a>
        </div>
        <div className="hero-note"><MousePointer2 size={21} aria-hidden="true" /> No experience needed. Really.</div>
      </div>
      <CodeCard />
    </section>
  )
}

function CourseCard({ course }: { course: Course }) {
  return (
    <article className={`course-card course-${course.accent}`}>
      <div className="course-topline">
        <span>{course.number}</span>
        <span className="course-icon" aria-hidden="true">{course.icon}</span>
      </div>
      <div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
      </div>
      <div className="course-meta">
        <span><BookOpen size={16} /> {course.lessons} lessons</span>
        <span>{course.duration}</span>
      </div>
      <a href="#method" aria-label={`Learn how ${course.title} works`}>Explore course <ChevronRight /></a>
    </article>
  )
}

function Courses() {
  return (
    <section className="courses section-shell" id="courses">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Pick your first path</span>
          <h2>Three skills.<br /><em>Endless</em> possibilities.</h2>
        </div>
        <p>Start at the beginning or follow your curiosity. Every course is built for people who are brand new to code.</p>
      </div>
      <div className="course-grid">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </section>
  )
}

function Method() {
  return (
    <section className="method" id="method">
      <div className="method-intro">
        <span className="section-kicker">How CodeBloom works</span>
        <h2>Less lecture.<br />More <em>aha!</em></h2>
        <p>Learning code shouldn&apos;t feel like reading a dictionary. We keep things visual, practical, and delightfully human.</p>
        <div className="tiny-proof"><span>10 min</span> average lesson length</div>
      </div>
      <ol className="step-list">
        {learningSteps.map((step) => (
          <li key={step.number}>
            <span className="step-number">{step.number}</span>
            <div><h3>{step.title}</h3><p>{step.description}</p></div>
            <Check aria-hidden="true" />
          </li>
        ))}
      </ol>
    </section>
  )
}

function Stories() {
  return (
    <section className="stories section-shell" id="stories">
      <div className="quote-mark" aria-hidden="true">“</div>
      <blockquote>
        <p>I used to close every coding tutorial after five minutes. CodeBloom was the first one that made me feel like I belonged here.</p>
        <footer>
          <span className="avatar" aria-hidden="true">MK</span>
          <span><strong>Maya K.</strong><small>Built her first portfolio in 3 weeks</small></span>
        </footer>
      </blockquote>
      <div className="story-stats" aria-label="CodeBloom learner statistics">
        <div><strong>94%</strong><span>finish their first lesson</span></div>
        <div><strong>4.9/5</strong><span>from new coders</span></div>
        <div><strong>30k+</strong><span>projects started</span></div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="final-cta">
      <div className="orbit orbit-one" aria-hidden="true" />
      <div className="orbit orbit-two" aria-hidden="true" />
      <span className="cta-spark" aria-hidden="true">✦</span>
      <p>YOUR NEXT CHAPTER STARTS HERE</p>
      <h2>Ready to grow<br />something <em>new?</em></h2>
      <a className="button button-dark" href="#courses">Start learning for free <ArrowRight /></a>
      <small>No credit card. No pressure. Just curiosity.</small>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true"><Asterisk /></span>CodeBloom</a>
      <p>Made with patience, practice, and plenty of snacks.</p>
      <div><a href="#courses">Courses</a><a href="#method">Method</a><a href="#stories">Stories</a></div>
      <span>© 2026 CodeBloom</span>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="grain" aria-hidden="true" />
      <Header />
      <main id="main-content">
        <Hero />
        <Courses />
        <Method />
        <Stories />
        <FinalCta />
      </main>
      <Footer />
    </>
  )
}
