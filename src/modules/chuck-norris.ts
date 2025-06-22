import axios from "axios";

export async function getRandomChuckNorrisJoke(): Promise<string> {
  const url = "https://api.chucknorris.io/jokes/random";
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      return response.data.value;
    }
  } catch (err) {
    console.error(err);
    return Promise.resolve(
      "An error occurred while fetching the Chuck Norris joke. Please try again later."
    );
  }
  return Promise.resolve("No joke found at the moment.");
}
