/** Current Duolingo web profile path is `/u/:userId` (numeric id), not `/profile/:username`. */
export function duolingoProfileUrl(userId: number | string) {
  return `https://www.duolingo.com/u/${userId}`;
}

export interface DuolingoCourse {
  title: string;
  learningLanguage: string;
  xp: number;
  crowns: number;
}

export interface DuolingoStats {
  username: string;
  name: string;
  streak: number;
  totalXp: number;
  learningLanguage: string;
  courses: DuolingoCourse[];
  profileUrl: string;
  userId: number;
}
