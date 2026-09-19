// Service 6: personalized daily question + streak calendar. Submission reuses
// subjectTestGraderService.submit (lib/subjectTests.js) — same grading endpoint.
import { request } from './api.js'

export const dailyQuestionService = {
  getToday: (token) => request('/api/daily-question', { token }),
  getCalendar: (token) => request('/api/daily-question/calendar', { token }),
}
