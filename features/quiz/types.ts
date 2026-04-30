export interface Option {
    id: string;
    optionText: string;
    isCorrect: boolean;
}

export interface Question {
    id: string;
    questionText: string;
    options: Option[];
}

export interface Reading {
    id: string;
    title: string;
    content: string;
    questions?: Question[];
}

// ── Admin request/response shapes ──────────────────────────────────────────

export interface ReadingRequest {
    title: string;
    content: string;
}

export interface QuestionRequest {
    questionText: string;
}

export interface OptionRequest {
    optionText: string;
    isCorrect: boolean;
}