import axios from "axios";

class UselessFact {
  private static randomFact = new URL(
    "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en"
  );
  private static todayFact = new URL(
    "https://uselessfacts.jsph.pl/api/v2/facts/today?language=en"
  );

  public static async getRandomFact(): Promise<string> {
    try {
      const response = await axios.get(this.randomFact.toString());
      return (
        response.data.text || "Well... no useless fact today ig, API issues.."
      );
    } catch (error) {
      console.error("Error fetching random fact:", error);
      throw new Error("Failed to fetch random fact");
    }
  }
  public static async getTodayFact(): Promise<string> {
    try {
      const response = await axios.get(this.todayFact.toString());
      return (
        response.data.text || "Well... no useless fact today ig, API issues.."
      );
    } catch (error) {
      console.error("Error fetching today's fact:", error);
      throw new Error("Failed to fetch today's fact");
    }
  }
}

export { UselessFact };
