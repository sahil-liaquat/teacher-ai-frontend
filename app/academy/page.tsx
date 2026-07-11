"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  GraduationCap,
  HelpCircle,
  Laptop,
  Linkedin,
  MapPin,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
  Video
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { backendApi, BACKEND_ROOT, CURRENT_USER_QUERY_KEY, ensureSession, getCurrentUser, type Host, type Workshop } from "@/lib/api";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const academyStats = [
  { label: "Practical demonstrations and guided sessions", value: "Live Learning", icon: Video, tone: "bg-teachpad-sky text-teachpad-blue" },
  { label: "Resources you can use with students", value: "Classroom-Ready Templates", icon: Sparkles, tone: "bg-teachpad-green text-emerald-700" },
  { label: "Focused learning with educators", value: "Guided Cohorts", icon: Users, tone: "bg-teachpad-lavender text-violet-700" },
  { label: "Exchange ideas and solve challenges", value: "Teacher Community", icon: GraduationCap, tone: "bg-teachpad-yellow text-amber-700" }
];

const whyAcademyFeatures = [
  {
    title: "Curriculum-Aware Learning",
    description: "Learn how to create relevant teaching resources using actual textbooks, chapters, learning outcomes, and board-specific curriculum requirements.",
    icon: BookOpen,
    tone: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    title: "Pedagogy First",
    description: "Use AI more effectively through Bloom's Taxonomy, differentiated instruction, learning objectives, assessment design, and structured lesson planning.",
    icon: GraduationCap,
    tone: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  },
  {
    title: "Practical, Live Learning",
    description: "Ask questions, follow demonstrations, share classroom challenges, and build resources alongside educators and experts.",
    icon: Laptop,
    tone: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    title: "Continuous Professional Growth",
    description: "Move beyond one-time webinars through structured learning tracks, guided practice, templates, and follow-up resources.",
    icon: ShieldCheck,
    tone: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
  {
    title: "Certificates of Completion",
    description: "Receive a printable certificate after completing eligible live workshops, cohorts, or professional development sessions.",
    icon: Award,
    tone: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    title: "Classroom-Ready Outcomes",
    description: "Finish each session with practical workflows, templates, and resources that can be applied directly in your classroom.",
    icon: CheckCircle,
    tone: "bg-violet-50 text-violet-600 border-violet-100",
  },
];

const learningTracks = [
  {
    title: "AI-Powered Assessment Design",
    subtitle: "Growth Track 1",
    description: "Learn how to create effective worksheets, quizzes, question banks, rubrics, and differentiated assessments using TeachPad.",
    details: ["Effective worksheet structures", "Bloom's Taxonomy-based questioning", "Balanced question-set creation", "Adaptive and differentiated assessments", "Quiz and question-bank workflows"],
    color: "from-blue-500/10 to-indigo-500/10 hover:border-blue-300",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    title: "Smarter Curriculum Planning",
    subtitle: "Growth Track 2",
    description: "Learn how to plan lessons, align resources with the syllabus, map textbook content, and design meaningful classroom activities.",
    details: ["Curriculum and syllabus alignment", "Lesson sequencing and learning objectives", "Classroom activity and game planning", "Textbook-grounded content creation", "Chapter, topic, and learning-outcome mapping"],
    color: "from-fuchsia-500/10 to-purple-500/10 hover:border-fuchsia-300",
    badgeColor: "bg-fuchsia-100 text-fuchsia-800",
  },
  {
    title: "Classroom Visuals and Presentations",
    subtitle: "Growth Track 3",
    description: "Transform textbook content into engaging presentations, teaching notes, visual explainers, and multimedia learning resources.",
    details: ["Presentation structure and slide design", "Classroom-friendly visual storytelling", "Teaching-note and outline generation", "Multimedia resource planning", "PPTX creation and export workflows"],
    color: "from-amber-500/10 to-orange-500/10 hover:border-amber-300",
    badgeColor: "bg-amber-100 text-amber-800",
  },
];

const academyFaqs = [
  {
    question: "Are the workshops free for TeachPad users?",
    answer: "Some workshops and learning sessions may be free, while specialised cohorts or school training programmes may require a registration fee. Each session page will clearly show the applicable details.",
  },
  {
    question: "Will I receive a certificate?",
    answer: "Certificates of Completion are available for eligible workshops, cohorts, and professional development programmes when attendance or completion requirements are met.",
  },
  {
    question: "What happens if I miss a live session?",
    answer: "Recording and replay availability may vary by session. Any recording, resource, or follow-up details will be mentioned on the registration page.",
  },
  {
    question: "Can schools request customised training?",
    answer: "Yes. Schools can request tailored training programmes for teachers, academic coordinators, department heads, or leadership teams.",
  },
];

export default function AcademyLandingPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const userQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      const hasSession = await ensureSession();
      if (!hasSession) return null;
      try {
        return await getCurrentUser({ redirectOnUnauthorized: false });
      } catch {
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: false
  });

  const workshopsQuery = useQuery({
    queryKey: ["academy-workshops"],
    queryFn: () => backendApi.workshops({ destination: "landing_page", status: "published" })
  });

  const isLoggedIn = !!userQuery.data?.id;
  const workshops = workshopsQuery.data?.items || [];
  const featuredWorkshop = workshops.find((workshop) => workshop.is_featured) || workshops[0];
  const remainingWorkshops = featuredWorkshop
    ? workshops.filter((workshop) => workshop.id !== featuredWorkshop.id)
    : workshops;

  const trainers = useMemo(() => {
    const hostMap = new Map<string, Host>();
    workshops.forEach((workshop) => {
      workshop.hosts.forEach((host) => {
        if (!hostMap.has(host.id)) hostMap.set(host.id, host);
      });
    });
    return Array.from(hostMap.values());
  }, [workshops]);

  const registerMutation = useMutation({
    mutationFn: (workshopId: string) => backendApi.registerWorkshop(workshopId),
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "Your seat is reserved. You can view joining details in your dashboard.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ["academy-workshops"] });
      queryClient.invalidateQueries({ queryKey: ["app-workshops"] });
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error: any) => {
      if (error?.status === 401) {
        toast({
          title: "Authentication required",
          description: "Redirecting to login page...",
          variant: "error"
        });
        window.location.href = "/login?next=/academy";
        return;
      }
      toast({
        title: "Registration failed",
        description: getErrorMessage(error, "Check deadline and try again."),
        variant: "error"
      });
    }
  });

  function registerOrLogin(workshopId: string) {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/dashboard/workshops/${workshopId}`;
      return;
    }
    registerMutation.mutate(workshopId);
  }

  return (
    <div className="min-h-screen bg-white text-[#07111f]">
      <MarketingHeader active="academy" />

      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_16%_8%,#eef6ff_0,transparent_28%),radial-gradient(circle_at_88%_16%,#f8f0ff_0,transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-8 pt-10 sm:gap-10 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-8 lg:pb-24 lg:pt-20">
            <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
                <GraduationCap className="h-4 w-4" />
                TeachPad Teacher Growth Hub
              </div>
              <h1 className="text-[34px] font-black leading-[1.05] tracking-tight text-slate-950 min-[390px]:text-[40px] sm:text-6xl lg:text-[64px]">
                Learn practical AI skills.
                <br />
                <span className="text-blue-600">Grow as an educator.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-600 sm:text-lg sm:leading-8 lg:mx-0">
                Join expert-led workshops, guided learning tracks, and teacher cohorts focused on lesson planning, textbook-grounded content creation, assessments, classroom activities, presentations, and practical AI workflows for schools.
              </p>

              <div className="mx-auto mt-7 flex max-w-[420px] flex-col justify-center gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center lg:mx-0 lg:justify-start">
                <a href="#workshops" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                  Explore Workshops <ArrowRight className="h-4 w-4" />
                </a>
                <Link href={isLoggedIn ? "/dashboard/workshops" : "/signup"} className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                  {isLoggedIn ? "Open Dashboard" : "Create Free Account"}
                </Link>
              </div>

              <div className="mt-8 hidden gap-3 sm:grid sm:grid-cols-2 xl:grid-cols-4">
                {academyStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.value} className="rounded-2xl border border-teachpad-cardBorder bg-white/86 p-4 text-left shadow-[0_16px_36px_rgba(30,80,90,0.07)] backdrop-blur-sm">
                      <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", stat.tone)}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-sm font-black text-slate-950">{stat.value}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[820px] lg:-mr-10 lg:max-w-none">
              <div className="hero-blob left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
              <div className="hero-float relative z-10">
                <Image
                  src="/landing/school-3d-v2.png"
                  alt="Teacher development and classroom learning illustration"
                  width={1600}
                  height={900}
                  priority
                  className="mx-auto h-auto w-full max-w-[300px] drop-shadow-[0_34px_54px_rgba(47,79,129,0.18)] sm:max-w-none"
                />
              </div>
              <div className="absolute bottom-5 left-5 z-20 hidden max-w-[310px] rounded-2xl border border-teachpad-cardBorder bg-white/88 p-4 shadow-[0_18px_48px_rgba(30,80,90,0.12)] backdrop-blur-xl sm:bottom-9 sm:left-8 sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teachpad-sky text-teachpad-blue">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">Professional growth built around real classrooms</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Curriculum-aware learning for teachers and school teams.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="workshops" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
              <Calendar className="h-4 w-4" />
              Upcoming sessions
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Choose your next <span className="text-blue-600">growth opportunity.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Explore upcoming workshops, learning cohorts, expert sessions, and teacher development programmes. View registration status, deadlines, hosts, schedules, and joining details in one place.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/dashboard/workshops" className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600">
              View Sessions in Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {workshopsQuery.isLoading ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-72 animate-pulse rounded-2xl border border-teachpad-cardBorder bg-white shadow-[0_18px_50px_rgba(30,80,90,0.08)]" />
              ))}
            </div>
          ) : null}

          {!workshopsQuery.isLoading && !workshops.length ? (
            <div className="mx-auto mt-10 grid max-w-5xl items-center gap-8 rounded-2xl border border-teachpad-cardBorder bg-[linear-gradient(135deg,#f8ffff_0%,#ffffff_100%)] p-6 shadow-[0_18px_50px_rgba(30,80,90,0.08)] sm:grid-cols-[0.75fr_1.25fr] sm:p-8">
              <Image
                src="/landing/backpack-globe-v2.png"
                alt="Backpack, globe, books, and stationery illustration"
                width={600}
                height={420}
                className="mx-auto h-auto w-full max-w-xs"
              />
              <div className="text-center sm:text-left">
                <h3 className="text-2xl font-black leading-tight text-slate-950">No sessions are currently scheduled.</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">
                  The next TeachPad Growth Hub sessions are being prepared. Create your free account and check your dashboard for upcoming workshop and cohort announcements.
                </p>
                <Link href="/signup" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                  Join TeachPad Free
                </Link>
              </div>
            </div>
          ) : null}

          {featuredWorkshop ? (
            <div className="mt-10">
              <FeaturedWorkshop
                workshop={featuredWorkshop}
                onRegister={() => registerOrLogin(featuredWorkshop.id)}
                isRegistering={registerMutation.isPending && registerMutation.variables === featuredWorkshop.id}
              />
            </div>
          ) : null}

          {remainingWorkshops.length ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {remainingWorkshops.map((workshop) => (
                <WorkshopCard
                  key={workshop.id}
                  workshop={workshop}
                  onRegister={() => registerOrLogin(workshop.id)}
                  isRegistering={registerMutation.isPending && registerMutation.variables === workshop.id}
                />
              ))}
            </div>
          ) : null}
        </section>

        {/* Growth Hub Difference */}
        <section className="bg-slate-50 border-t border-b border-slate-100 px-5 py-20 sm:px-6 lg:px-8 lg:py-28 relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-100/30 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mx-auto max-w-7xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
                  <Sparkles className="h-4 w-4" />
                  The Growth Hub Difference
                </div>
                <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                  Why grow with <span className="text-blue-600">TeachPad?</span>
                </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
                TeachPad Growth Hub combines practical AI skills, sound teaching practices, curriculum alignment, and real classroom workflows.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {whyAcademyFeatures.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={index}
                    className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_36px_rgba(30,80,90,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_24px_50px_rgba(37,99,235,0.06)]"
                  >
                    <span className={cn("grid h-12 w-12 place-items-center rounded-2xl border transition-transform duration-300 group-hover:scale-110", feat.tone)}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-black text-slate-950">{feat.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-500">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Learning Tracks & Curriculum */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
              <GraduationCap className="h-4 w-4" />
              Growth Tracks
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Build skills that improve <span className="text-blue-600">everyday teaching.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Choose structured learning tracks covering classroom planning, assessment creation, curriculum alignment, and visual content design.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {learningTracks.map((track, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-3xl border border-slate-200 bg-gradient-to-b p-8 shadow-[0_18px_48px_rgba(30,80,90,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_rgba(30,80,90,0.08)] bg-white/70",
                  track.color
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider", track.badgeColor)}>
                    {track.subtitle}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-black text-slate-950 leading-tight">{track.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{track.description}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-200/60">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">What you will learn:</h4>
                  <ul className="mt-4 space-y-3">
                    {track.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {trainers.length ? (
          <section className="overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] px-5 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="mx-auto max-w-7xl">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
                  <Users className="h-4 w-4" />
                  Growth Hub faculty
                </div>
                <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                  Learn from classroom and curriculum practitioners.
                </h2>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {trainers.map((host) => (
                  <InstructorCard key={host.id} host={host} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Alumni Testimonials */}
        <section className="px-5 py-20 sm:px-6 lg:px-8 lg:py-28 bg-white overflow-hidden border-t border-slate-100">
          <div className="mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
                <Star className="h-4 w-4 fill-current text-amber-500" />
                Teacher Experiences
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                See how educators are <span className="text-blue-600">growing with TeachPad.</span>
              </h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Mrs. Shreya Sen",
                  role: "Class 8 Science Teacher",
                  org: "St. Xavier's Academy",
                  quote: "TeachPad Growth Hub changed the way I approach lesson preparation. I now create more structured worksheets and classroom presentations in much less time.",
                },
                {
                  name: "Dr. Amit Sharma",
                  role: "School Principal",
                  org: "Silver Oak Global School",
                  quote: "The curriculum-planning sessions helped our department create more consistent, structured, and board-aligned teaching resources.",
                },
                {
                  name: "Mr. Rajesh Kumar",
                  role: "Mathematics Teacher",
                  org: "Delhi Public School",
                  quote: "Learning how to use textbook-grounded AI gave me more confidence in the relevance and accuracy of the resources I create.",
                },
              ].map((test, index) => (
                <div
                  key={index}
                  className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_16px_36px_rgba(30,80,90,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_24px_50px_rgba(37,99,235,0.07)]"
                >
                  <div className="flex gap-1 mb-4 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-7 text-slate-600 italic">
                    "{test.quote}"
                  </p>
                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 font-black text-blue-600 text-sm">
                      {test.name.charAt(test.name.indexOf(".") + 2)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950">{test.name}</h4>
                      <p className="text-xs text-slate-400 font-semibold">{test.role}, {test.org}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive FAQ Accordion */}
        <section className="bg-slate-50 border-t border-b border-slate-100 px-5 py-20 sm:px-6 lg:px-8 lg:py-28 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-50/20 rounded-full blur-3xl pointer-events-none" />
          <div className="mx-auto max-w-4xl relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-600 shadow-[0_12px_26px_rgba(37,99,235,0.08)]">
                <HelpCircle className="h-4 w-4 text-blue-500" />
                Frequently Asked Questions
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Everything you need to know about <span className="text-blue-600">TeachPad Growth Hub.</span>
              </h2>
            </div>

            <div className="space-y-4">
              {academyFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-200"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-6 text-left font-bold text-slate-900"
                    >
                      <span className="text-base sm:text-lg">{faq.question}</span>
                      <ChevronDown className={cn("h-5 w-5 text-slate-400 transition-transform duration-300", isOpen && "rotate-180 text-blue-600")} />
                    </button>
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        <p className="border-t border-slate-100 p-6 text-sm leading-7 text-slate-600 bg-slate-50/50">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:px-8 lg:py-28">
            <div className="text-center lg:text-left">
              <h2 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0">
                Turn professional growth into classroom impact.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-600 lg:mx-0">
                Use the same account for workshops, lesson plans, worksheets, notes, presentations, and saved resources.
              </p>
              <Link href={isLoggedIn ? "/dashboard" : "/signup"} className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-black text-white shadow-[0_18px_36px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                {isLoggedIn ? "Go to Dashboard" : "Start Free"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Image
              src="/landing/teacher-hub-connections.png"
              alt="Teacher Growth Hub connections illustration"
              width={900}
              height={700}
              className="marketing-float-slow mx-auto h-auto w-full max-w-xl drop-shadow-[0_24px_42px_rgba(47,79,129,0.12)]"
            />
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function FeaturedWorkshop({
  workshop,
  onRegister,
  isRegistering
}: {
  workshop: Workshop;
  onRegister: () => void;
  isRegistering: boolean;
}) {
  const details = getWorkshopDetails(workshop);

  return (
    <div className="grid overflow-hidden rounded-2xl border border-teachpad-cardBorder bg-white/90 shadow-[0_22px_60px_rgba(30,80,90,0.10)] backdrop-blur-sm lg:grid-cols-[0.92fr_1.08fr] group hover:-translate-y-0.5 hover:border-blue-100/50 transition-all duration-300">
      <div className="relative min-h-[300px] bg-[linear-gradient(135deg,#dffafa_0%,#f2dcff_100%)] overflow-hidden">
        {workshop.banner_url ? (
          <img src={`${BACKEND_ROOT}/uploads/${workshop.banner_url}`} alt={workshop.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
            <Image src="/ai-tools/classroom-tools-header-illustration.png" alt="" fill className="object-cover" sizes="(min-width: 1024px) 40vw, 100vw" />
          </div>
        )}
        <div className="absolute left-4 top-4 flex gap-2 z-10">
          <Badge className="border-white/70 bg-white/92 text-slate-950">Featured</Badge>
          <ModeBadge mode={workshop.mode} />
        </div>
      </div>

      <div className="flex flex-col justify-between p-6 sm:p-8">
        <div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-600" /> {details.date}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-600" /> {details.time}</span>
          </div>
          <h3 className="mt-4 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{workshop.title}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
            {workshop.description || "A practical TeachPad Teacher Growth Hub workshop for planning, creating, and refining classroom-ready AI resources."}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoTile label="Seats" value={details.seats} />
          <InfoTile label="Duration" value={details.duration} />
          <InfoTile label="Deadline" value={details.deadline} />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <HostLine hosts={workshop.hosts} />
          <WorkshopAction workshop={workshop} onRegister={onRegister} isRegistering={isRegistering} />
        </div>
      </div>
    </div>
  );
}

function WorkshopCard({
  workshop,
  onRegister,
  isRegistering
}: {
  workshop: Workshop;
  onRegister: () => void;
  isRegistering: boolean;
}) {
  const details = getWorkshopDetails(workshop);

  return (
    <Card className="h-full overflow-hidden rounded-2xl border-teachpad-cardBorder bg-white/90 shadow-[0_18px_50px_rgba(30,80,90,0.08)] backdrop-blur-sm group hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_24px_50px_rgba(37,99,235,0.06)] transition-all duration-300">
      <div className="relative h-44 bg-[linear-gradient(135deg,#dffafa_0%,#e9e1ff_100%)] overflow-hidden">
        {workshop.banner_url ? (
          <img src={`${BACKEND_ROOT}/uploads/${workshop.banner_url}`} alt={workshop.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-blue-600 transition-transform duration-700 group-hover:scale-105">
            <Image src="/landing/lesson-planner-3d-v2.png" alt="" width={220} height={180} className="h-36 w-36 object-contain drop-shadow-[0_18px_32px_rgba(47,79,129,0.12)]" />
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <ModeBadge mode={workshop.mode} />
        </div>
      </div>
      <CardContent className="p-5">
        <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-600" /> {details.date}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-blue-600" /> {details.time}</span>
        </div>
        <h3 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-slate-950">{workshop.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {workshop.description || "Learn practical classroom AI workflows with TeachPad's Teacher Growth Hub."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <InfoTile label="Seats" value={details.seats} compact />
          <InfoTile label="Duration" value={details.duration} compact />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <HostLine hosts={workshop.hosts} compact />
          <div className="mt-4">
            <WorkshopAction workshop={workshop} onRegister={onRegister} isRegistering={isRegistering} fullWidth />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InstructorCard({ host }: { host: Host }) {
  return (
    <div className="rounded-2xl border border-teachpad-cardBorder bg-white/90 p-5 shadow-[0_18px_50px_rgba(30,80,90,0.08)] backdrop-blur-sm">
      <div className="flex items-start gap-4">
        {host.profile_photo ? (
          <img src={`${BACKEND_ROOT}/uploads/${host.profile_photo}`} alt={host.full_name} className="h-16 w-16 rounded-2xl border border-white object-cover shadow-sm" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-blue-100 bg-teachpad-sky text-blue-600">
            <User className="h-8 w-8" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-slate-950">{host.full_name}</h3>
          {host.designation ? <p className="mt-1 text-xs font-bold text-blue-600">{host.designation}</p> : null}
          {host.organization ? <p className="mt-0.5 text-xs font-semibold text-slate-500">{host.organization}</p> : null}
        </div>
      </div>
      {host.bio ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{host.bio}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {host.years_of_experience ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teachpad-yellow px-3 py-1 text-xs font-bold text-slate-700">
            <Award className="h-3.5 w-3.5 text-amber-600" /> {host.years_of_experience}+ yrs
          </span>
        ) : null}
        {host.linkedin ? (
          <a href={host.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
            <Linkedin className="h-3.5 w-3.5" /> LinkedIn
          </a>
        ) : null}
      </div>
    </div>
  );
}

function WorkshopAction({
  workshop,
  onRegister,
  isRegistering,
  fullWidth = false
}: {
  workshop: Workshop;
  onRegister: () => void;
  isRegistering: boolean;
  fullWidth?: boolean;
}) {
  if (workshop.is_registered) {
    return (
      <Link href={`/dashboard/workshops/${workshop.id}`} className={cn("inline-flex h-11 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 transition hover:bg-emerald-100", fullWidth && "w-full")}>
        <CheckCircle className="h-4 w-4" /> View Registration
      </Link>
    );
  }

  return (
    <div className={cn("flex gap-2", fullWidth && "w-full")}>
      <Link href={`/dashboard/workshops/${workshop.id}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-black text-slate-900 transition hover:border-blue-200 hover:text-blue-600">
        Details
      </Link>
      <Button onClick={onRegister} disabled={isRegistering} className="h-11 flex-1 rounded-full">
        {isRegistering ? "Registering..." : "Register"}
      </Button>
    </div>
  );
}

function HostLine({ hosts, compact = false }: { hosts: Host[]; compact?: boolean }) {
  if (!hosts.length) {
    return <p className="text-xs font-semibold text-slate-400">Host to be announced</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex -space-x-2">
        {hosts.slice(0, compact ? 2 : 3).map((host) => (
          host.profile_photo ? (
            <img key={host.id} src={`${BACKEND_ROOT}/uploads/${host.profile_photo}`} alt={host.full_name} className="h-8 w-8 rounded-full border-2 border-white object-cover" />
          ) : (
            <span key={host.id} className="grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-blue-50 text-blue-600">
              <User className="h-4 w-4" />
            </span>
          )
        ))}
      </div>
      <p className="min-w-0 truncate text-xs font-bold text-slate-600">
        {hosts.map((host) => host.full_name).join(", ")}
      </p>
    </div>
  );
}

function InfoTile({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-teachpad-cardBorder bg-teachpad-tag p-3", compact && "p-2.5")}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function ModeBadge({ mode }: { mode: Workshop["mode"] }) {
  const modeConfig = {
    online: { label: "Online", icon: Laptop, className: "bg-blue-50 text-blue-700 border-blue-100" },
    offline: { label: "In-Person", icon: MapPin, className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    hybrid: { label: "Hybrid", icon: Video, className: "bg-teachpad-yellow text-amber-700 border-amber-100" }
  }[mode];
  const Icon = modeConfig.icon;

  return (
    <Badge className={cn("shadow-sm", modeConfig.className)}>
      <Icon className="h-3.5 w-3.5" /> {modeConfig.label}
    </Badge>
  );
}

function getWorkshopDetails(workshop: Workshop) {
  const scheduledAt = new Date(workshop.scheduled_at);
  const date = scheduledAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const time = scheduledAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
  const seats = workshop.max_capacity
    ? `${Math.max(0, workshop.max_capacity - workshop.registered_users_count)} left`
    : "Open";
  const duration = workshop.duration_minutes ? `${workshop.duration_minutes} mins` : "Live";
  const deadline = workshop.registration_deadline
    ? new Date(workshop.registration_deadline).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      })
    : "Open";

  return { date, time, seats, duration, deadline };
}
