"use client";

import type { ActivityKind } from "@/lib/api";

type Json = Record<string, unknown>;

export function ActivityOutputView({
  kind,
  output,
}: {
  kind: ActivityKind;
  output: Json | null;
}) {
  if (!output || typeof output !== "object") {
    return <p className="text-sm text-gray-500">—</p>;
  }
  switch (kind) {
    case "lesson_plan":
      return <LessonPlanView plan={output} />;
    case "worksheet":
      return <WorksheetView output={output} />;
    case "notes":
      return <NotesView output={output} />;
    case "activity":
      return <ActivityView output={output} />;
    case "presentation":
      return <PresentationView output={output} />;
    default:
      return <p className="text-sm text-gray-500">—</p>;
  }
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value
      .filter((item) => item != null && String(item).trim() !== "")
      .map((item) => String(item))
      .join("\n");
  }
  return String(value);
}

function asList(value: unknown): unknown[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function isEmptyList(value: unknown): boolean {
  return asList(value).length === 0;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-gray-900">{title}</h3>
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">{children}</div>
    </section>
  );
}

function Prose({ value }: { value: unknown }) {
  const text = asText(value);
  return text ? (
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{text}</p>
  ) : (
    <p className="text-sm text-gray-400">—</p>
  );
}

function Bullets({ items }: { items: unknown }) {
  const list = asList(items).filter((item) => asText(item) !== "");
  if (list.length === 0) return <p className="text-sm text-gray-400">—</p>;
  return (
    <ul className="space-y-1.5">
      {list.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm leading-6 text-gray-700">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
          <span className="min-w-0 whitespace-pre-wrap break-words">{asText(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: unknown }) {
  const list = asList(items).filter((item) => asText(item) !== "");
  if (list.length === 0) return <p className="text-sm text-gray-400">—</p>;
  return (
    <ol className="space-y-1.5">
      {list.map((item, index) => (
        <li key={index} className="flex gap-2 text-sm leading-6 text-gray-700">
          <span className="shrink-0 font-bold text-gray-500">{index + 1}.</span>
          <span className="min-w-0 whitespace-pre-wrap break-words">{asText(item)}</span>
        </li>
      ))}
    </ol>
  );
}

function MetadataPills({ metadata }: { metadata: Json }) {
  const pairs: [string, unknown][] = (
    [
      ["Subject", metadata.subject],
      ["Grade", metadata.grade ?? metadata.class],
      ["Chapter", metadata.chapter],
      ["Topic", metadata.topic],
      ["Book", metadata.book ?? metadata.textbook],
      ["Board", metadata.board],
      ["Duration", metadata.duration ?? (metadata.duration_minutes ? `${metadata.duration_minutes} min` : null)],
    ] as [string, unknown][]
  ).filter(([, value]) => value != null && asText(value) !== "");
  if (pairs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pairs.map(([label, value]) => (
        <span key={label} className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          {label}: {asText(value)}
        </span>
      ))}
    </div>
  );
}

function StepTable({ steps }: { steps: unknown }) {
  const list = asList(steps);
  if (list.length === 0) return <p className="text-sm text-gray-400">—</p>;
  return (
    <div className="space-y-3">
      {list.map((step, index) => {
        const row = (step ?? {}) as Json;
        const time = asText(row.time);
        return (
          <div key={index} className="rounded-lg border border-gray-100 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Step {index + 1}</span>
              {time ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">{time}</span>
              ) : null}
              {asText(row.phase) ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{asText(row.phase)}</span>
              ) : null}
            </div>
            {asText(row.teacher_action) ? (
              <p className="mt-2 text-sm leading-6 text-gray-700">
                <span className="font-semibold text-gray-500">Teacher: </span>
                <span className="whitespace-pre-wrap break-words">{asText(row.teacher_action)}</span>
              </p>
            ) : null}
            {asText(row.student_action) ? (
              <p className="mt-1 text-sm leading-6 text-gray-700">
                <span className="font-semibold text-gray-500">Students: </span>
                <span className="whitespace-pre-wrap break-words">{asText(row.student_action)}</span>
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function LessonPlanView({ plan }: { plan: Json }) {
  const metadata = (plan.metadata ?? {}) as Json;
  const steps = plan.lesson_flow ?? plan.lesson_outline ?? [];
  const objectives = plan.learning_objectives;
  const concepts = plan.key_concepts;
  const materials = plan.materials_needed;
  const questions = asList(plan.assessment_questions);
  const differentiation = (plan.differentiation ?? {}) as Json;
  const features = asList(plan.physical_properties_key_features);
  const schoolSections = asList(plan.school_format_sections);

  return (
    <div className="space-y-5">
      <section>
        <h2 className="break-words text-lg font-black text-gray-900">{asText(plan.title) || "Generated Lesson Plan"}</h2>
        {asText(plan.textbook_source) ? <p className="mt-1 text-xs font-semibold text-gray-500">{asText(plan.textbook_source)}</p> : null}
        <div className="mt-2"><MetadataPills metadata={metadata} /></div>
      </section>

      <Section title="Learning Objectives">
        <Bullets items={objectives} />
      </Section>

      <Section title="Key Concepts">
        <Bullets items={concepts} />
      </Section>

      <Section title="Lesson Flow">
        <StepTable steps={steps} />
      </Section>

      {!isEmptyList(materials) && (
        <Section title="Materials Needed">
          <Bullets items={materials} />
        </Section>
      )}

      {asText(plan.previous_knowledge) && (
        <Section title="Previous Knowledge">
          <Prose value={plan.previous_knowledge} />
        </Section>
      )}

      {asText(plan.introduction_warm_up) && (
        <Section title="Introduction / Warm-up">
          <Prose value={plan.introduction_warm_up} />
        </Section>
      )}

      {asText(plan.explanation_of_concept) && (
        <Section title="Explanation of Concept">
          <Prose value={plan.explanation_of_concept} />
        </Section>
      )}

      {!isEmptyList(features) && (
        <Section title="Physical Properties / Key Features">
          <FeatureList features={features} />
        </Section>
      )}

      {asText(plan.classroom_activity ?? plan.activity) && (
        <Section title="Activity">
          <Prose value={plan.classroom_activity ?? plan.activity} />
        </Section>
      )}

      {asText(plan.chemical_properties_main_concept_details) && (
        <Section title="Chemical Properties / Main Concept Details">
          <Prose value={plan.chemical_properties_main_concept_details} />
        </Section>
      )}

      {asText(plan.uses_daily_life_connection) && (
        <Section title="Uses / Daily Life Connection">
          <Prose value={plan.uses_daily_life_connection} />
        </Section>
      )}

      {questions.length > 0 && (
        <Section title="Assessment Questions">
          <ol className="space-y-2">
            {questions.map((question, index) => {
              if (question && typeof question === "object") {
                const q = question as Json;
                return (
                  <li key={index} className="flex gap-2 text-sm leading-6 text-gray-700">
                    <span className="shrink-0 font-bold text-gray-500">{index + 1}.</span>
                    <span className="min-w-0 break-words">
                      {asText(q.question)}
                      {q.marks != null ? <span className="ml-2 shrink-0 text-xs font-bold text-gray-400">({asText(q.marks)} marks)</span> : null}
                    </span>
                  </li>
                );
              }
              return (
                <li key={index} className="flex gap-2 text-sm leading-6 text-gray-700">
                  <span className="shrink-0 font-bold text-gray-500">{index + 1}.</span>
                  <span className="min-w-0 whitespace-pre-wrap break-words">{asText(question)}</span>
                </li>
              );
            })}
          </ol>
        </Section>
      )}

      {asText(plan.board_work) && (
        <Section title="Board Work">
          <Prose value={plan.board_work} />
        </Section>
      )}

      {asText(plan.homework) && (
        <Section title="Homework">
          <Prose value={plan.homework} />
        </Section>
      )}

      {asText(plan.learning_outcome) && (
        <Section title="Learning Outcome">
          <Prose value={plan.learning_outcome} />
        </Section>
      )}

      {Object.keys(differentiation).length > 0 && (
        <Section title="Differentiation">
          <div className="space-y-2">
            {Object.entries(differentiation).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm leading-6 text-gray-700">
                <span className="w-24 shrink-0 font-semibold capitalize text-gray-500">{key}</span>
                <span className="min-w-0 whitespace-pre-wrap break-words">{asText(value)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {schoolSections.length > 0 && (
        <Section title="School Format">
          <div className="space-y-3">
            {schoolSections.map((section, index) => (
              <SchoolFormatSection key={index} section={(section ?? {}) as Json} depth={0} />
            ))}
          </div>
        </Section>
      )}

      {asText(plan.teacher_notes) && (
        <Section title="Teacher Notes">
          <Prose value={plan.teacher_notes} />
        </Section>
      )}
    </div>
  );
}

function FeatureList({ features }: { features: unknown[] }) {
  return (
    <ul className="space-y-1.5">
      {features.map((feature, index) => {
        if (feature && typeof feature === "object") {
          const entries = Object.entries(feature as Json).filter(([, value]) => asText(value) !== "");
          if (entries.length > 0) {
            return (
              <li key={index} className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm leading-6 text-gray-700">
                {entries.map(([key, value]) => (
                  <span key={key} className="min-w-0">
                    <span className="font-semibold capitalize text-gray-500">{key.replace(/_/g, " ")}: </span>
                    {asText(value)}
                  </span>
                ))}
              </li>
            );
          }
        }
        return <li key={index} className="flex gap-2 text-sm leading-6 text-gray-700"><span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" /><span className="min-w-0 whitespace-pre-wrap break-words">{asText(feature)}</span></li>;
      })}
    </ul>
  );
}

function SchoolFormatSection({ section, depth }: { section: Json; depth: number }) {
  const children = asList(section.children);
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-3">
      <h4 className="text-sm font-bold text-gray-900">{asText(section.title) || "Section"}</h4>
      {asText(section.content) ? (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{asText(section.content)}</p>
      ) : null}
      {children.length > 0 && (
        <div className={`mt-2 space-y-2 ${depth > 0 ? "pl-3" : ""}`}>
          {children.map((child, index) => (
            <SchoolFormatSection key={index} section={(child ?? {}) as Json} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function WorksheetView({ output }: { output: Json }) {
  const metadata = (output.metadata ?? {}) as Json;
  const sections = asList((output.student_worksheet as Json | undefined)?.sections);
  const answerKey = asList(output.answer_key);
  const markingScheme = asList(output.marking_scheme);
  const title = asText(output.title) || "Worksheet";

  return (
    <div className="space-y-5">
      <section>
        <h2 className="break-words text-lg font-black text-gray-900">{title}</h2>
        <div className="mt-2"><MetadataPills metadata={metadata} /></div>
      </section>

      {asText(output.instructions) && (
        <Section title="Instructions">
          <Prose value={output.instructions} />
        </Section>
      )}

      <Section title="Worksheet">
        {sections.length === 0 ? (
          <p className="text-sm text-gray-400">—</p>
        ) : (
          <div className="space-y-4">
            {sections.map((section, sectionIndex) => {
              const s = (section ?? {}) as Json;
              const questions = asList(s.questions);
              return (
                <div key={sectionIndex} className="rounded-lg border border-gray-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{asText(s.section_title) || `Section ${sectionIndex + 1}`}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      {asText(s.question_type) ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">{asText(s.question_type)}</span>
                      ) : null}
                      {s.marks != null ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{asText(s.marks)} marks</span>
                      ) : null}
                    </div>
                  </div>
                  <ol className="mt-2 space-y-3">
                    {questions.map((question, questionIndex) => (
                      <WorksheetQuestion key={questionIndex} question={(question ?? {}) as Json} index={questionIndex} type={asText(s.question_type)} />
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {answerKey.length > 0 && (
        <Section title="Answer Key">
          <div className="space-y-3">
            {answerKey.map((item, index) => {
              const a = (item ?? {}) as Json;
              const answers = asList(a.answers);
              return (
                <div key={index} className="rounded-lg border border-gray-100 bg-white p-3">
                  <h4 className="text-sm font-bold text-gray-900">{asText(a.section_title) || `Section ${index + 1}`}</h4>
                  <NumberedList items={answers} />
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {markingScheme.length > 0 && (
        <Section title="Marking Scheme">
          <div className="space-y-3">
            {markingScheme.map((item, index) => {
              const m = (item ?? {}) as Json;
              const guidelines = asList(m.guidelines);
              return (
                <div key={index} className="rounded-lg border border-gray-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{asText(m.section_title) || `Section ${index + 1}`}</h4>
                    {m.marks_per_question != null ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{asText(m.marks_per_question)} marks/question</span>
                    ) : null}
                  </div>
                  <Bullets items={guidelines} />
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}

function WorksheetQuestion({ question, index, type }: { question: Json; index: number; type: string }) {
  const left = asList(question.left_column ?? question.left);
  const right = asList(question.right_column ?? question.right);
  const options = asList(question.options);
  const answerLines = Number(question.answer_lines ?? defaultAnswerLines(type));

  return (
    <li>
      <p className="text-sm leading-6 text-gray-700">
        <span className="mr-2 font-bold text-gray-500">{index + 1}.</span>
        <span className="whitespace-pre-wrap break-words">{asText(question.question)}</span>
      </p>
      {options.length > 0 && (
        <div className="mt-1.5 space-y-1 pl-6">
          {options.map((option, optionIndex) => (
            <p key={optionIndex} className="flex gap-2 text-sm text-gray-700">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-gray-300" />
              <span className="min-w-0 whitespace-pre-wrap break-words">{asText(option)}</span>
            </p>
          ))}
        </div>
      )}
      {left.length > 0 && right.length > 0 && (
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="w-1/2 border-r border-gray-200 px-3 py-1.5">Column A</th>
                <th className="px-3 py-1.5">Column B</th>
              </tr>
            </thead>
            <tbody>
              {left.map((item, rowIndex) => (
                <tr key={rowIndex} className="border-t border-gray-100">
                  <td className="break-words border-r border-gray-100 px-3 py-1.5">
                    <span className="font-bold text-gray-500">{rowIndex + 1}. </span>
                    {asText(item)}
                  </td>
                  <td className="break-words px-3 py-1.5">
                    <span className="font-bold text-gray-500">{String.fromCharCode(65 + rowIndex)}. </span>
                    {asText(right[rowIndex])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {options.length === 0 && left.length === 0 && (
        <div className="mt-2 space-y-2 pl-6">
          {Array.from({ length: Math.max(1, Math.min(answerLines, 6)) }).map((_, line) => (
            <span key={line} className="block h-4 border-b border-dashed border-gray-300" />
          ))}
        </div>
      )}
    </li>
  );
}

function defaultAnswerLines(questionType: string): number {
  const type = questionType.toLowerCase();
  if (type.includes("long")) return 5;
  if (type.includes("application")) return 3;
  if (type.includes("short")) return 2;
  if (type.includes("one word")) return 1;
  return 1;
}

function NotesView({ output }: { output: Json }) {
  const metadata = (output.metadata ?? {}) as Json;
  const sections = asList(output.sections);
  const terms = asList(output.key_terms);
  const title = asText(output.title) || "Notes";

  return (
    <div className="space-y-5">
      <section>
        <h2 className="break-words text-lg font-black text-gray-900">{title}</h2>
        <div className="mt-2"><MetadataPills metadata={metadata} /></div>
      </section>

      {asText(output.quick_overview) && (
        <Section title="Quick Overview">
          <Prose value={output.quick_overview} />
        </Section>
      )}

      <Section title="Learning Goals">
        <Bullets items={output.learning_goals} />
      </Section>

      {sections.length > 0 && (
        <Section title="Sections">
          <div className="space-y-3">
            {sections.map((section, index) => {
              const s = (section ?? {}) as Json;
              return (
                <div key={index} className="rounded-lg border border-gray-100 bg-white p-3">
                  <h4 className="text-sm font-bold text-gray-900">{asText(s.heading)}</h4>
                  {asText(s.explanation) && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{asText(s.explanation)}</p>}
                  {!isEmptyList(s.key_points) && (
                    <div className="mt-2">
                      <Bullets items={s.key_points} />
                    </div>
                  )}
                  {!isEmptyList(s.examples) && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">Examples</p>
                      <Bullets items={s.examples} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {terms.length > 0 && (
        <Section title="Key Terms">
          <div className="space-y-2">
            {terms.map((term, index) => {
              const t = (term ?? {}) as Json;
              return (
                <div key={index} className="flex gap-2 text-sm leading-6 text-gray-700">
                  <span className="w-36 shrink-0 font-semibold text-gray-900">{asText(t.term)}</span>
                  <span className="min-w-0 whitespace-pre-wrap break-words">{asText(t.meaning)}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Blackboard Summary">
        <Bullets items={output.blackboard_summary} />
      </Section>

      <Section title="Revision Questions">
        <NumberedList items={output.revision_questions} />
      </Section>

      {asText(output.student_summary) && (
        <Section title="Student Summary">
          <Prose value={output.student_summary} />
        </Section>
      )}

      {asText(output.teacher_notes) && (
        <Section title="Teacher Notes">
          <Prose value={output.teacher_notes} />
        </Section>
      )}
    </div>
  );
}

function ActivityView({ output }: { output: Json }) {
  const metadata = (output.metadata ?? {}) as Json;
  const differentiation = (output.differentiation ?? {}) as Json;
  const title = asText(output.title) || "Activity";

  return (
    <div className="space-y-5">
      <section>
        <h2 className="break-words text-lg font-black text-gray-900">{title}</h2>
        <div className="mt-2"><MetadataPills metadata={metadata} /></div>
      </section>

      {asText(output.overview) && (
        <Section title="Overview">
          <Prose value={output.overview} />
        </Section>
      )}

      <Section title="Learning Objectives">
        <Bullets items={output.learning_objectives} />
      </Section>

      {!isEmptyList(output.materials) && (
        <Section title="Materials">
          <Bullets items={output.materials} />
        </Section>
      )}

      {!isEmptyList(output.setup) && (
        <Section title="Setup">
          <Bullets items={output.setup} />
        </Section>
      )}

      <Section title="Activity Steps">
        <StepTable steps={output.activity_steps} />
      </Section>

      {asText(output.grouping_plan) && (
        <Section title="Grouping Plan">
          <Prose value={output.grouping_plan} />
        </Section>
      )}

      <Section title="Discussion Prompts">
        <Bullets items={output.discussion_prompts} />
      </Section>

      <Section title="Assessment">
        <Bullets items={output.assessment} />
      </Section>

      {Object.keys(differentiation).length > 0 && (
        <Section title="Differentiation">
          <div className="space-y-2">
            {Object.entries(differentiation).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-sm leading-6 text-gray-700">
                <span className="w-24 shrink-0 font-semibold capitalize text-gray-500">{key}</span>
                <span className="min-w-0 whitespace-pre-wrap break-words">{asText(value)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Exit Ticket">
        <Bullets items={output.exit_ticket} />
      </Section>

      {asText(output.teacher_notes) && (
        <Section title="Teacher Notes">
          <Prose value={output.teacher_notes} />
        </Section>
      )}
    </div>
  );
}

function PresentationView({ output }: { output: Json }) {
  const slides = asList(output.slides);
  const teacherNotes = asList(output.teacher_notes);
  const duration = output.estimated_duration_minutes;

  return (
    <div className="space-y-5">
      <section>
        <h2 className="break-words text-lg font-black text-gray-900">{asText(output.title) || "Presentation"}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {duration != null ? (
            <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-600">
              Estimated duration: {asText(duration)} min
            </span>
          ) : null}
          <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-600">
            {slides.length} slides
          </span>
        </div>
      </section>

      {asText(output.summary) && (
        <Section title="Summary">
          <Prose value={output.summary} />
        </Section>
      )}

      <Section title="Slides">
        {slides.length === 0 ? (
          <p className="text-sm text-gray-400">—</p>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, index) => {
              const s = (slide ?? {}) as Json;
              const bullets = asList(s.bullet_points);
              const quiz = asList(s.quiz_questions);
              return (
                <div key={index} className="rounded-lg border border-gray-100 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900">{asText(s.title) || `Slide ${index + 1}`}</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">Slide {asText(s.slide_number) || index + 1}</span>
                      {asText(s.layout) ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{asText(s.layout)}</span>
                      ) : null}
                    </div>
                  </div>
                  {asText(s.subtitle) && <p className="mt-1 text-sm italic text-gray-600">{asText(s.subtitle)}</p>}
                  {bullets.length > 0 && <div className="mt-2"><Bullets items={bullets} /></div>}
                  {asText(s.visual_prompt) && (
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-bold uppercase tracking-wider text-gray-400">Visual prompt: </span>
                      <span className="whitespace-pre-wrap">{asText(s.visual_prompt)}</span>
                    </p>
                  )}
                  {asText(s.activity_prompt) && (
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-bold uppercase tracking-wider text-gray-400">Activity: </span>
                      <span className="whitespace-pre-wrap">{asText(s.activity_prompt)}</span>
                    </p>
                  )}
                  {asText(s.speaker_notes) && (
                    <p className="mt-2 text-xs text-gray-500">
                      <span className="font-bold uppercase tracking-wider text-gray-400">Speaker notes: </span>
                      <span className="whitespace-pre-wrap">{asText(s.speaker_notes)}</span>
                    </p>
                  )}
                  {quiz.length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Quiz</p>
                      <Bullets items={quiz} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {teacherNotes.length > 0 && (
        <Section title="Teacher Notes">
          <Bullets items={teacherNotes} />
        </Section>
      )}
    </div>
  );
}
