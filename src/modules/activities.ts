import axios from "axios";

export type ActivityType =
  | "education"
  | "recreational"
  | "social"
  | "charity"
  | "cooking"
  | "relaxation"
  | "busywork";
export type Activity = {
  activity: string;
  availability: number;
  type: ActivityType;
  participants: number;
  price: number;
  accessibility: string;
  duration: string;
  kidFriendly: boolean;
  link: string;
  key: string;
};

export async function getRandomActivity(): Promise<Activity | string> {
  const url = `https://bored-api.appbrewery.com/random`;
  try {
    const response = await axios.get(url);
    if (response.status === 200 && response.data) {
      const activity: Activity = response.data;
      return activity;
    }
  } catch (error) {
    console.error("Error fetching random activity:", error);
  }
  return "No activity found.";
}
