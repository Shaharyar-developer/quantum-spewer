import axios from "axios";
import type { NumbersCommandType } from "./commands/numbers-fact";

export async function getRandomNumberFact(
  type: NumbersCommandType,
  value: string
): Promise<string> {
  const url = `http://numbersapi.com/${value}/${type}`;
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      return response.data;
    }
  } catch (err) {
    console.error(err);
    return Promise.resolve(
      "An error occurred while fetching the number fact. Please try again later."
    );
  }
  return Promise.resolve("No fact found for the given input.");
}
