const hasActivity_ = (
  date: GoogleAppsScript.Base.Date
): false | GoogleAppsScript.Calendar.CalendarEvent => {
  const calendar: GoogleAppsScript.Calendar.Calendar =
    CalendarApp.getCalendarById(CALENDAR_ID);
  const options = { search: "定期活動" };
  const events: GoogleAppsScript.Calendar.CalendarEvent[] =
    calendar.getEventsForDay(date, options);
  if (!events) {
    return false;
  } else {
    return events[0];
  }
};
