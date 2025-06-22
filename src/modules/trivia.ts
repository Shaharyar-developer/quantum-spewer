import axios from "axios";

export const CATEGORIES_TABLE = [
  {
    id: 25,
    name: "Art",
  },
  {
    id: 27,
    name: "Animals",
  },
  {
    id: 16,
    name: "Entertainment: Board Games",
  },
  {
    id: 10,
    name: "Entertainment: Books",
  },
  {
    id: 32,
    name: "Entertainment: Cartoon & Animations",
  },
  {
    id: 29,
    name: "Entertainment: Comics",
  },
  {
    id: 11,
    name: "Entertainment: Film",
  },
  {
    id: 31,
    name: "Entertainment: Japanese Anime & Manga",
  },
  {
    id: 12,
    name: "Entertainment: Music",
  },
  {
    id: 13,
    name: "Entertainment: Musicals & Theatres",
  },
  {
    id: 14,
    name: "Entertainment: Television",
  },
  {
    id: 15,
    name: "Entertainment: Video Games",
  },
  {
    id: 26,
    name: "Celebrities",
  },
  {
    id: 18,
    name: "Science: Computers",
  },
  {
    id: 30,
    name: "Science: Gadgets",
  },
  {
    id: 19,
    name: "Science: Mathematics",
  },
  {
    id: 17,
    name: "Science & Nature",
  },
  {
    id: 9,
    name: "General Knowledge",
  },
  {
    id: 22,
    name: "Geography",
  },
  {
    id: 23,
    name: "History",
  },
  {
    id: 20,
    name: "Mythology",
  },
  {
    id: 24,
    name: "Politics",
  },
  {
    id: 21,
    name: "Sports",
  },
  {
    id: 28,
    name: "Vehicles",
  },
];

export type TriviaCategory =
  | "General Knowledge"
  | "Entertainment: Books"
  | "Entertainment: Film"
  | "Entertainment: Music"
  | "Entertainment: Musicals & Theatres"
  | "Entertainment: Television"
  | "Entertainment: Video Games"
  | "Entertainment: Board Games"
  | "Science & Nature"
  | "Science: Computers"
  | "Science: Mathematics"
  | "Mythology"
  | "Sports"
  | "Geography"
  | "History"
  | "Politics"
  | "Art"
  | "Celebrities"
  | "Animals"
  | "Vehicles"
  | "Entertainment: Comics"
  | "Science: Gadgets"
  | "Entertainment: Japanese Anime & Manga"
  | "Entertainment: Cartoon & Animations";
export type TriviaDifficulty = "easy" | "medium" | "hard";
export type TriviaQuestionType = "multiple" | "boolean";

export interface TriviaQuestion {
  category: TriviaCategory;
  type: TriviaQuestionType;
  difficulty: TriviaDifficulty;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

type Params = {
  category?: string;
  difficulty?: TriviaDifficulty;
  type?: TriviaQuestionType;
};

export async function getTrivia(params: Params) {
  let url = `https://opentdb.com/api.php?amount=1&encode=url3986`;

  if (params.category) {
    url += `&category=${params.category}`;
  }
  if (params.difficulty) {
    url += `&difficulty=${params.difficulty}`;
  }
  if (params.type) {
    url += `&type=${params.type}`;
  }
  try {
    const response = await axios.get(url);
    if (response.data.response_code !== 0) {
      throw new Error("No trivia questions found.");
    }
    return response.data.results as TriviaQuestion[];
  } catch (error) {
    console.error("Error fetching trivia:", error);
    throw error;
  }
}
