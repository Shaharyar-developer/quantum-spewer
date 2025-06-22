import axios from "axios";

export async function getDadJoke(): Promise<string> {
  const url = "https://icanhazdadjoke.com/";
  try {
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
      },
    });
    if (response.status === 200 && response.data) {
      return response.data.joke;
    }
  } catch (error) {
    console.error("Error fetching dad joke:", error);
  }
  return "No dad joke found.";
}

export async function getRandomJoke(): Promise<
  | {
      setup: string;
      punchline: string;
    }
  | string
> {
  const url = "https://official-joke-api.appspot.com/random_joke";
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      return {
        setup: response.data.setup,
        punchline: response.data.punchline,
      };
    }
  } catch (error) {
    console.error("Error fetching random joke:", error);
  }
  return "No joke found.";
}
