export async function fetchTimetable() {
  try {
    const res = await fetch("/api/timetable");
    if (!res.ok) {
      throw new Error("Failed to fetch timetable");
    }
    const data = await res.json();

    return data || {};
  } catch (err) {
    console.error("Error fetching timetable:", err);
    return {};
  }
}
