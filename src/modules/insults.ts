import axios from "axios";

export const getCorpoInsult = async (): Promise<string> => {
  const url = "https://insult.mattbas.org/api/insult?lang=en_corporate";
  const fallbackInsult =
    "Let's circle back and touch base offline about your bandwidth.";

  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      return response.data;
    } else {
      return fallbackInsult;
    }
  } catch (error) {
    console.error("Error fetching insult:", error);
    return fallbackInsult;
  }
};
