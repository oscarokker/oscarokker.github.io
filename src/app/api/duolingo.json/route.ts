import { NextResponse } from "next/server";
import {
  duolingoProfileUrl,
  type DuolingoCourse,
  type DuolingoStats,
} from "@/lib/duolingo";

export const dynamic = "force-static";

const USERNAME = "OscarRode";
const USER_ID = 1000201223;
const DUOLINGO_URL = `https://www.duolingo.com/2017-06-30/users?username=${USERNAME}`;

interface DuolingoApiCourse {
  title?: string;
  learningLanguage?: string;
  xp?: number;
  crowns?: number;
}

interface DuolingoApiUser {
  id?: number;
  username?: string;
  name?: string;
  streak?: number;
  totalXp?: number;
  learningLanguage?: string;
  courses?: DuolingoApiCourse[];
  streakData?: {
    currentStreak?: { length?: number };
    previousStreak?: { length?: number };
  };
}

export async function GET() {
  try {
    const response = await fetch(DUOLINGO_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OscarRodePortfolio/1.0; +https://oscarrode.com)",
        Accept: "application/json",
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Duolingo profile" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as { users?: DuolingoApiUser[] };
    const user = data.users?.[0];

    if (!user) {
      return NextResponse.json(
        { error: "Duolingo user not found" },
        { status: 404 },
      );
    }

    const streak = Math.max(
      user.streak ?? 0,
      user.streakData?.currentStreak?.length ?? 0,
      user.streakData?.previousStreak?.length ?? 0,
    );

    const courses: DuolingoCourse[] = (user.courses ?? [])
      .map((course) => ({
        title: course.title ?? course.learningLanguage ?? "Course",
        learningLanguage: course.learningLanguage ?? "",
        xp: course.xp ?? 0,
        crowns: course.crowns ?? 0,
      }))
      .sort((a, b) => b.xp - a.xp);

    const userId = user.id ?? USER_ID;
    const stats: DuolingoStats = {
      username: user.username ?? USERNAME,
      name: user.name ?? "Oscar Rode",
      streak,
      totalXp: user.totalXp ?? 0,
      learningLanguage: user.learningLanguage ?? courses[0]?.learningLanguage ?? "",
      courses,
      userId,
      profileUrl: duolingoProfileUrl(userId),
    };

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Duolingo request failed" },
      { status: 502 },
    );
  }
}
