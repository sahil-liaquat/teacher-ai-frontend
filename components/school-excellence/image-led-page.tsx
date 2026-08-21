"use client";

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Eye,
  GraduationCap,
  Layers3,
  Lightbulb,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { useLeadForm } from "./lead-form";

const imageRoot = "/landing/school-excellence-2026";
const generatedRoot = `${imageRoot}/generated`;
const ease = [0.16, 1, 0.3, 1] as const;

const phases = [
  {
    number: "01",
    title: "Understand",
    days: "Days 1–10",
    summary: "Study the school’s academic systems, teacher workflow and leadership priorities.",
    details: ["Academic planning", "Curriculum structure", "Classroom challenges"],
    receives: ["School Excellence Scorecard", "Academic System Review", "Priority Areas"],
    tone: "blue",
  },
  {
    number: "02",
    title: "Design",
    days: "Days 11–20",
    summary: "Create a practical plan with clear goals, participants and success measures.",
    details: ["Improvement goals", "Initial classes or teachers", "Progress reviews"],
    receives: ["60-Day Excellence Plan", "Clear Goals", "Success Measures"],
    tone: "violet",
  },
  {
    number: "03",
    title: "Build",
    days: "Days 21–30",
    summary: "Strengthen the systems and configure TeachPad around the school’s curriculum.",
    details: ["Academic workspace", "Curriculum organisation", "Teacher support tools"],
    receives: ["Connected Workspace", "Structured Curriculum", "Clear Planning"],
    tone: "amber",
  },
  {
    number: "04",
    title: "Practice",
    days: "Days 31–50",
    summary: "Support teachers as better academic habits move into real classrooms.",
    details: ["Lesson preparation", "Relevant resources", "Classroom progress"],
    receives: ["Implementation Support", "Progress Reviews", "Classroom Feedback"],
    tone: "green",
  },
  {
    number: "05",
    title: "Improve",
    days: "Days 51–60",
    summary: "Review what changed and turn the evidence into the school’s next plan.",
    details: ["Teacher participation", "Curriculum progress", "Classroom implementation"],
    receives: ["Excellence Report", "Updated Scorecard", "Next 90-Day Plan"],
    tone: "coral",
  },
] as const;

const shifts = [
  ["Plans live in separate documents", "Teachers clearly see what happens next"],
  ["Preparation is repeated from scratch", "Teachers begin with relevant resources"],
  ["Progress depends on manual updates", "Leadership sees implementation more clearly"],
  ["Academic gaps are noticed late", "Support reaches gaps earlier"],
  ["Improvement depends on individuals", "Good practice becomes easier to repeat"],
] as const;

const teacherSupport = [
  ["Planning", "Understand what needs to be taught—and why."],
  ["Preparation", "Create lessons and resources more efficiently."],
  ["Classroom practice", "Use plans while adapting to students."],
  ["Assessment", "Check student understanding simply."],
  ["Reflection", "Know what needs revisiting or improving."],
] as const;

const deliverables = [
  ["01", "School Excellence Scorecard", "A clear starting picture of the school’s academic systems."],
  ["02", "School Academic Review", "A structured review of current practices and challenges."],
  ["03", "60-Day Excellence Plan", "A focused improvement plan built around the school’s priorities."],
  ["04", "TeachPad Academic Workspace", "A digital academic system configured around the curriculum."],
  ["05", "Leadership Alignment Session", "Clear goals, roles and responsibilities for the leadership team."],
  ["06", "Teacher Development Sessions", "Practical sessions using the school’s own curriculum."],
  ["07", "Weekly Implementation Review", "A regular rhythm to understand progress and solve problems."],
  ["08", "Teacher Support", "Guidance throughout classroom implementation."],
  ["09", "School Excellence Report", "A concise record of what changed during the programme."],
  ["10", "Next 90-Day Improvement Plan", "Clear recommendations for the next stage."],
] as const;

const measures = [
  "Academic planning",
  "Teacher preparedness",
  "Curriculum implementation",
  "Classroom consistency",
  "Leadership visibility",
  "Teacher experience",
  "Academic follow-up",
] as const;

export function ImageLedSchoolExcellence() {
  const { openLeadForm } = useLeadForm();
  const [activePhase, setActivePhase] = useState(0);
  const reducedMotion = useReducedMotion();

  return (
    <div className="se3">
      <section className="se3-hero" aria-labelledby="school-excellence-title">
        <div className="se3-hero-grid" aria-hidden="true" />
        <div className="se3-hero-glow se3-hero-glow-one" aria-hidden="true" />
        <div className="se3-hero-glow se3-hero-glow-two" aria-hidden="true" />

        <div className="se3-shell se3-hero-inner">
          <motion.div
            className="se3-hero-copy"
            initial={reducedMotion ? undefined : { opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease }}
          >
            <p className="se3-kicker">School Excellence Program</p>
            <h1 id="school-excellence-title">
              Transform everyday teaching into <em>school-wide excellence.</em>
            </h1>
            <p className="se3-hero-lede">
              A guided school improvement programme that gives leaders clarity, teachers the right
              support, and classrooms a stronger academic direction.
            </p>
            <div className="se3-hero-actions">
              <button className="se3-button se3-button-gold" onClick={() => openLeadForm("pilot")}>
                Begin Your 60-Day Journey <ArrowRight aria-hidden="true" />
              </button>
              <a
                className="se3-button se3-button-quiet"
                href="https://calendly.com/sahil-oneskool/school-excellence-program"
              >
                Speak With Our Team
              </a>
            </div>
            <div className="se3-hero-proof" aria-label="How the programme works">
              <span><Check aria-hidden="true" /> Built around your school</span>
              <span><Check aria-hidden="true" /> Guided implementation</span>
              <span><Check aria-hidden="true" /> Visible evidence of change</span>
            </div>
          </motion.div>

        </div>

        <div className="se3-principles" aria-label="Programme principles">
          <div className="se3-principles-track">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1}>
                <span>Understand your school</span><i />
                <span>Strengthen your systems</span><i />
                <span>Support your teachers</span><i />
                <span>Measure improvement</span><i />
              </div>
            ))}
          </div>
        </div>
      </section>

      <RevealSection className="se3-section se3-vision">
        <div className="se3-shell">
          <div className="se3-editorial-heading">
            <div>
              <Eyebrow>Vision → everyday practice</Eyebrow>
              <h2>Every school has a vision. <span className="se3-blue">The challenge is making it visible every day.</span></h2>
            </div>
            <p>
              A strong curriculum and an experienced team are not always enough. The small gaps between
              planning, preparation, classroom practice and follow-up are where progress gets lost.
            </p>
          </div>
          <div className="se3-challenge-grid">
            {[
              [CalendarDays, "Different planning rhythms", "Teachers may prepare lessons in very different ways."],
              [Layers3, "Plans stay in documents", "Academic direction can remain separated from classroom work."],
              [Search, "Resources are hard to find", "Useful material exists, but not always at the moment it is needed."],
              [Eye, "Progress is difficult to see", "Coordinators spend hours collecting updates across classes."],
              [BarChart3, "Classes move unevenly", "Some classrooms move ahead while others need earlier support."],
            ].map(([Icon, title, copy], index) => {
              const ChallengeIcon = Icon as typeof CalendarDays;
              return (
                <motion.article
                  key={title as string}
                  className={`se3-challenge-card se3-challenge-card-${index + 1}`}
                  initial={reducedMotion ? undefined : { opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.65, delay: index * 0.07, ease }}
                >
                  <span><ChallengeIcon aria-hidden="true" /></span>
                  <h3>{title as string}</h3>
                  <p>{copy as string}</p>
                </motion.article>
              );
            })}
            <article className="se3-challenge-answer">
              <span><Sparkles aria-hidden="true" /></span>
              <p>These are not signs that a school is failing.</p>
              <h3>They show where its academic systems can become stronger.</h3>
            </article>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="diagnostic" className="se3-section se3-diagnostic">
        <div className="se3-shell se3-diagnostic-layout">
          <div className="se3-diagnostic-heading">
            <Eyebrow>We start by understanding</Eyebrow>
            <h2>No two schools need <span className="se3-blue">the same improvement plan.</span></h2>
            <p>
              Before changing anything, we study how your school currently works. The conversation is
              practical, respectful and grounded in the systems your team already uses.
            </p>
          </div>

          <motion.div
            className="se3-diagnostic-art"
            initial={reducedMotion ? undefined : { opacity: 0, y: 32, scale: 0.975 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-90px" }}
            transition={{ duration: 0.9, ease }}
          >
            <Image
              src={`${imageRoot}/school-understanding-framework.png`}
              alt="Seven areas TeachPad studies before planning improvement: academic planning, curriculum implementation, teacher preparation, classroom practice, academic leadership, teacher support, and assessment and follow-up."
              width={1536}
              height={1024}
              sizes="(max-width: 900px) 94vw, 58vw"
            />
          </motion.div>
        </div>
      </RevealSection>

      <RevealSection className="se3-section se3-focus">
        <div className="se3-shell se3-focus-layout">
          <div className="se3-focus-copy">
            <Eyebrow>Choose the right priorities</Eyebrow>
            <h2>Meaningful change needs <span className="se3-blue">a clear focus.</span></h2>
            <p>
              We do not try to change everything in 60 days. Leadership selects two or three areas where
              better systems can make the greatest difference.
            </p>
          </div>
          <motion.div
            className="se3-priorities-art"
            initial={reducedMotion ? undefined : { opacity: 0, y: 34, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.85, ease }}
          >
            <Image
              src={`${imageRoot}/school-priorities.png`}
              alt="Seven school improvement priorities: lesson preparation, curriculum implementation, academic planning, classroom consistency, assessment practices, leadership visibility, and teacher support."
              width={1448}
              height={1086}
              sizes="(max-width: 640px) 100vw, (max-width: 1100px) 94vw, 1120px"
            />
          </motion.div>
        </div>
      </RevealSection>

      <RevealSection id="journey" className="se3-section se3-journey">
        <div className="se3-shell">
          <div className="se3-heading-center se3-heading-light">
            <Eyebrow light>The 60-day school excellence journey</Eyebrow>
            <h2>Five phases. <span className="se3-blue">One practical cycle of improvement.</span></h2>
            <p>Each phase gives the school a clear purpose, a manageable next step and something useful to keep.</p>
          </div>

          <div className="se3-journey-nav" role="tablist" aria-label="Programme phases">
            {phases.map((phase, index) => (
              <button
                key={phase.number}
                type="button"
                role="tab"
                aria-selected={activePhase === index}
                aria-controls={`se3-phase-${index}`}
                className={activePhase === index ? "is-active" : ""}
                onClick={() => setActivePhase(index)}
              >
                <span>{phase.number}</span>
                <b>{phase.title}</b>
                <small>{phase.days}</small>
              </button>
            ))}
            <motion.div
              className="se3-journey-indicator"
              animate={{ x: `${activePhase * 100}%` }}
              transition={{ type: "spring", stiffness: 230, damping: 28 }}
              aria-hidden="true"
            />
          </div>

          <div className="se3-journey-panel-wrap">
            {phases.map((phase, index) => (
              <motion.article
                id={`se3-phase-${index}`}
                key={phase.number}
                role="tabpanel"
                className={`se3-journey-panel se3-phase-${phase.tone}${activePhase === index ? " is-active" : ""}`}
                initial={false}
                animate={{ opacity: activePhase === index ? 1 : 0, y: activePhase === index ? 0 : 18 }}
                transition={{ duration: 0.45, ease }}
                aria-hidden={activePhase !== index}
              >
                <div className="se3-phase-main">
                  <div className="se3-phase-number">{phase.number}</div>
                  <div>
                    <p>{phase.days}</p>
                    <h3>{phase.title}</h3>
                    <span>{phase.summary}</span>
                  </div>
                </div>
                <div className="se3-phase-details">
                  <p>We focus on</p>
                  {phase.details.map((detail) => <span key={detail}><Check aria-hidden="true" />{detail}</span>)}
                </div>
                <div className="se3-phase-receives">
                  <p>Your school receives</p>
                  {phase.receives.map((item) => <strong key={item}>{item}</strong>)}
                </div>
              </motion.article>
            ))}
          </div>

        </div>
      </RevealSection>

      <RevealSection className="se3-section se3-shifts">
        <div className="se3-shell">
          <div className="se3-editorial-heading">
            <div><Eyebrow>What changes</Eyebrow><h2>Stronger systems make <span className="se3-blue">better practice easier to repeat.</span></h2></div>
            <p>The programme is designed to change the everyday experience of teachers and leaders—not add another layer of administration.</p>
          </div>
          <div className="se3-shift-table">
            <div className="se3-shift-head"><span>Before</span><span>After</span></div>
            {shifts.map(([before, after], index) => (
              <motion.div
                className="se3-shift-row"
                key={before}
                initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.07, ease }}
              >
                <p><span>{String(index + 1).padStart(2, "0")}</span>{before}</p>
                <i><ArrowRight aria-hidden="true" /></i>
                <strong><Check aria-hidden="true" />{after}</strong>
              </motion.div>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="teachers" className="se3-section se3-teachers">
        <div className="se3-shell">
          <div className="se3-teacher-grid">
            <div className="se3-teacher-art">
              <div className="se3-teacher-halo" aria-hidden="true" />
              <Image
                src={`${generatedRoot}/teacher-workspace-cutout.png`}
                alt="A teacher using a connected academic workspace to prepare for class."
                width={1448}
                height={1086}
                sizes="(max-width: 980px) 92vw, 48vw"
              />
              <div className="se3-context-chips" aria-label="Academic context used by TeachPad AI">
                <span>Class</span><span>Curriculum</span><span>Topic</span><span>Learning objectives</span>
              </div>
            </div>
            <div className="se3-teacher-copy">
              <Eyebrow>Better support for teachers</Eyebrow>
              <h2>Less blank-screen work. <span className="se3-blue">More confidence for the classroom.</span></h2>
              <p>
                Teachers are at the centre of the programme. The goal is not to give them more work—it is
                to make their existing work easier, clearer and more useful.
              </p>
              <div className="se3-teacher-support">
                {teacherSupport.map(([title, copy], index) => (
                  <div key={title}><span>{index + 1}</span><h3>{title}</h3><p>{copy}</p></div>
                ))}
              </div>
            </div>
          </div>
          <div className="se3-ai-banner">
            <div className="se3-ai-icon"><Sparkles aria-hidden="true" /></div>
            <div>
              <span>AI that understands the academic context</span>
              <h3>TeachPad helps teachers prepare—it never replaces their professional judgement.</h3>
            </div>
            <p>Lesson plans · activities · worksheets · assessments · questions · teaching resources</p>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="leadership" className="se3-section se3-leadership">
        <div className="se3-shell">
          <div className="se3-heading-center se3-heading-light">
            <Eyebrow light>Better visibility for school leadership</Eyebrow>
            <h2>See where support is needed <span className="se3-blue">before small gaps become bigger problems.</span></h2>
            <p>The purpose is not to monitor teachers. It is to help leadership support teachers better.</p>
          </div>
          <div className="se3-leadership-stage">
            <motion.div
              className="se3-dashboard-main"
              initial={reducedMotion ? undefined : { opacity: 0, x: -35, rotateY: 5 }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.85, ease }}
            >
              <Image
                src={`${generatedRoot}/leadership-dashboard-cutout.png`}
                alt="A school excellence dashboard showing academic implementation and teacher engagement."
                width={1672}
                height={941}
                sizes="(max-width: 980px) 94vw, 62vw"
              />
            </motion.div>
            <motion.div
              className="se3-dashboard-side"
              initial={reducedMotion ? undefined : { opacity: 0, x: 28, y: 30 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.15, ease }}
            >
              <Image
                src={`${generatedRoot}/learning-progress-cutout.png`}
                alt="A school leader reviewing learning progress across key areas."
                width={1672}
                height={941}
                sizes="(max-width: 980px) 80vw, 34vw"
              />
            </motion.div>
          </div>
          <div className="se3-leadership-signals">
            {[
              [BookOpen, "Curriculum progress", "What has been covered—and what remains?"],
              [Users, "Teacher participation", "Where is planning active or slowing down?"],
              [Target, "Academic gaps", "Which classes need additional support?"],
              [BarChart3, "Improvement priorities", "Where should the academic team focus next?"],
            ].map(([Icon, title, copy]) => {
              const SignalIcon = Icon as typeof BookOpen;
              return <article key={title as string}><SignalIcon aria-hidden="true" /><h3>{title as string}</h3><p>{copy as string}</p></article>;
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="se3-section se3-direction">
        <div className="se3-shell">
          <div className="se3-direction-grid">
            <div className="se3-direction-copy">
              <Eyebrow>One shared academic direction</Eyebrow>
              <h2>Everyone understands <span className="se3-blue">where the school is going.</span></h2>
              <p>Different roles, one connected rhythm—from curriculum intent to classroom practice and progress.</p>
              <div className="se3-role-flow">
                {[
                  [ShieldCheck, "School leadership", "Sets the academic direction."],
                  [Layers3, "Academic coordinators", "Turn direction into clear plans and support."],
                  [GraduationCap, "Teachers", "Bring those plans into classrooms."],
                  [Sparkles, "TeachPad", "Connects curriculum, preparation and progress."],
                ].map(([Icon, title, copy], index) => {
                  const RoleIcon = Icon as typeof ShieldCheck;
                  return (
                    <article key={title as string}>
                      <span><RoleIcon aria-hidden="true" /></span>
                      <div><small>0{index + 1}</small><h3>{title as string}</h3><p>{copy as string}</p></div>
                      {index < 3 ? <ChevronRight aria-hidden="true" /> : null}
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="se3-direction-art">
              <Image
                src={`${generatedRoot}/school-team-cutout.png`}
                alt="School leaders and teachers aligning around shared academic goals."
                width={1672}
                height={941}
                sizes="(max-width: 980px) 92vw, 48vw"
              />
              <blockquote>“Your curriculum. Your teachers. Your identity. One stronger academic system.”</blockquote>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection id="outcomes" className="se3-section se3-deliverables">
        <div className="se3-shell">
          <div className="se3-editorial-heading">
            <div><Eyebrow>What every school receives</Eyebrow><h2>Not a presentation. <span className="se3-blue">A complete improvement toolkit.</span></h2></div>
            <p>Every output has a purpose during the 60 days—and remains useful after the programme ends.</p>
          </div>
          <div className="se3-deliverable-grid">
            {deliverables.map(([number, title, copy], index) => (
              <motion.article
                key={number}
                initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: (index % 5) * 0.055, ease }}
              >
                <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>
              </motion.article>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="se3-section se3-measurement">
        <div className="se3-shell se3-measurement-grid">
          <div className="se3-measurement-copy">
            <Eyebrow light>How we measure improvement</Eyebrow>
            <h2>Improvement should <span className="se3-blue">be visible.</span></h2>
            <p>
              We review the same areas at the beginning and end so the school can see what changed,
              what needs more support and what should happen next.
            </p>
            <div className="se3-measure-chips">
              {measures.map((measure) => <span key={measure}><Check aria-hidden="true" />{measure}</span>)}
            </div>
            <blockquote>
              Not every improvement can be reduced to one number. But every programme should leave clear evidence of what changed.
            </blockquote>
          </div>
          <div className="se3-measurement-art">
            <Image
              src={`${generatedRoot}/measurable-impact-cutout.png`}
              alt="A visual path showing clear goals, strong systems, supported teachers and measurable impact."
              width={1672}
              height={941}
              sizes="(max-width: 980px) 92vw, 50vw"
            />
          </div>
        </div>
      </RevealSection>

      <RevealSection className="se3-section se3-not-software">
        <div className="se3-shell">
          <div className="se3-heading-center">
            <Eyebrow>This is not a software implementation programme</Eyebrow>
            <h2>TeachPad is the tool. <span className="se3-blue">School improvement is the goal.</span></h2>
          </div>
          <div className="se3-three-parts">
            {[
              [Users, "People", "Support school leaders, coordinators and teachers.", "01"],
              [RefreshCw, "Process", "Improve how academic work moves through the school.", "02"],
              [Sparkles, "Technology", "Make strong processes easier to follow and improve.", "03"],
            ].map(([Icon, title, copy, number]) => {
              const PartIcon = Icon as typeof Users;
              return <article key={title as string}><small>{number as string}</small><span><PartIcon aria-hidden="true" /></span><h3>{title as string}</h3><p>{copy as string}</p></article>;
            })}
          </div>
          <div className="se3-identity-note">
            <Lightbulb aria-hidden="true" />
            <div><h3>Built around your school</h3><p>We strengthen what already exists. Your curriculum remains yours. Your teachers remain in control. Your school keeps its identity.</p></div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="se3-section se3-continuous">
        <div className="se3-shell se3-continuous-grid">
          <div className="se3-continuous-copy">
            <Eyebrow>What happens after 60 days?</Eyebrow>
            <h2>Improvement becomes a rhythm, <span className="se3-blue">not a one-time intervention.</span></h2>
            <p>
              Some systems will be ready to expand. Others may need more time. The School Excellence
              Report gives leadership a clear starting point for the next cycle.
            </p>
            <button className="se3-text-button" onClick={() => openLeadForm("consultation")}>
              Discuss your school’s priorities <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <motion.div
            className="se3-continuous-art"
            initial={reducedMotion ? undefined : { opacity: 0, y: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
          >
            <div className="se3-system-visual">
              <Image
                src={`${generatedRoot}/connected-system-cutout.png`}
                alt="TeachPad connecting curriculum, planning, resources, assessment and analytics into one continuous school improvement system."
                width={1536}
                height={1024}
                sizes="(max-width: 900px) 94vw, 58vw"
              />
              <span className="se3-system-label se3-system-label-curriculum" aria-hidden="true">Curriculum</span>
              <span className="se3-system-label se3-system-label-planning" aria-hidden="true">Planning</span>
              <span className="se3-system-label se3-system-label-resources" aria-hidden="true">Resources</span>
              <span className="se3-system-label se3-system-label-assessment" aria-hidden="true">Assessment</span>
              <span className="se3-system-label se3-system-label-analytics" aria-hidden="true">Analytics</span>
            </div>
          </motion.div>
        </div>
      </RevealSection>

      <section className="se3-final">
        <div className="se3-final-orb" aria-hidden="true" />
        <div className="se3-shell se3-final-inner">
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease }}
          >
            <p className="se3-final-kicker"><span><Sparkles aria-hidden="true" /></span> Start with one meaningful change</p>
            <h2>Better schools are built through <span className="se3-blue">better everyday practices.</span></h2>
            <p>Choose one clear academic challenge. Build a better system around it. Support your teachers. See what changes.</p>
            <div className="se3-final-actions">
              <button className="se3-button se3-button-gold" onClick={() => openLeadForm("pilot")}>
                Begin the 60-Day Journey <ArrowRight aria-hidden="true" />
              </button>
              <button className="se3-button se3-button-outline" onClick={() => openLeadForm("consultation")}>
                Discuss Your School’s Priorities
              </button>
            </div>
          </motion.div>
          <motion.div
            className="se3-final-emblem"
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.82, rotate: 7 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.12, ease }}
          >
            <Image
              src={`${imageRoot}/program-emblem.png`}
              alt="TeachPad School Excellence Program emblem"
              width={660}
              height={949}
              sizes="(max-width: 780px) 180px, 270px"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function RevealSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className: string;
  id?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={className}
      initial={reducedMotion ? undefined : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.75, ease }}
    >
      {children}
    </motion.section>
  );
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`se3-eyebrow${light ? " se3-eyebrow-light" : ""}`}><i />{children}</p>;
}
