export type CourseOutline = { title: string; description: string; lessons: { id: string; title: string }[]; version: number }
export type Lesson = { title: string; objective: string; explanation: string; example: string; version: number }
export type LessonProgress = { completed: boolean; code: string; updatedAt: unknown }
