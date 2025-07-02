import axios from "axios";

export const getInsult = async (ratio = 0.65): Promise<string> => {
  const useCorporate = Math.random() < ratio;
  const url = useCorporate
    ? "https://insult.mattbas.org/api/insult?lang=en_corporate"
    : "https://evilinsult.com/generate_insult.php?lang=en";
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
