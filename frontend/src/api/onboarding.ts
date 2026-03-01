import { apiClient } from "./client";

export interface QuizAnswer {
  question_key: string;
  answer_text: string;
}

export const submitQuiz = (answers: QuizAnswer[]) =>
  apiClient.post("/onboarding/quiz", { answers }).then((r) => r.data);
