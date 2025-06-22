import axios from "axios";

export const getInsult = async (ratio = 0.65): Promise<string> => {
  const lang = Math.random() < ratio ? "en_corporate" : "en";
  const url = `https://insult.mattbas.org/api/insult?lang=${lang}`;
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
