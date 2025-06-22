import axios from "axios";

interface Poem {
  title: string;
  author: string;
  lines: string[];
  linecount: string;
}

interface FilteredPoem {
  title: string;
  author: string;
  lines: string[];
  linecount: number;
}

export const getRandomPoem = async (): Promise<FilteredPoem> => {
  const url = "https://poetrydb.org/random/50";
  let poems: Poem[] = [];
  while (true) {
    const response = await axios.get<Poem[]>(url);
    poems = response.data.filter(
      (poem: Poem) => parseInt(poem.linecount, 10) < 50
    );
    if (poems.length > 0) break;
  }
  const randomIndex = Math.floor(Math.random() * poems.length);
  const poem = poems[randomIndex];
  if (!poem) {
    throw new Error("No poem found after filtering.");
  }
  return {
    title: poem.title,
    author: poem.author,
    lines: poem.lines,
    linecount: parseInt(poem.linecount, 10),
  };
};
