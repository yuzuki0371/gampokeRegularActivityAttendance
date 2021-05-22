/* eslint-disable @typescript-eslint/no-unused-vars */
const hasActivity_ = (
  date: GoogleAppsScript.Base.Date
): false | GoogleAppsScript.Calendar.CalendarEvent => {
  const calendar: GoogleAppsScript.Calendar.Calendar =
    CalendarApp.getCalendarById(CALENDAR_ID);
  const options = { search: "定期活動" };
  const events: GoogleAppsScript.Calendar.CalendarEvent[] =
    calendar.getEventsForDay(date, options);
  if (!events.length) {
    return false;
  } else {
    return events[0];
  }
};

const createForm_ = (
  title: string,
  event: GoogleAppsScript.Calendar.CalendarEvent
): { form: string; response: string; status: string } => {
  const form: GoogleAppsScript.Forms.Form = FormApp.create(title);
  form.setDescription(
    `岩手大学ポケモン同好会${event.getTitle()}
    参加希望者はこのフォームからエントリーしてください。
    時間：${Utilities.formatDate(
      event.getStartTime(),
      "JST",
      "HH:mm"
    )}～${Utilities.formatDate(event.getEndTime(), "JST", "HH:mm")}
    場所：${event.getLocation()}
    定員：15人`
  );
  form.addTextItem().setTitle("学籍番号").setRequired(true);
  const timeZone: string[] = [
    "16:00～17:00",
    "17:00～18:00",
    "18:00～19:00",
    "19:00～20:00",
  ];
  timeZone.forEach((time: string) =>
    form
      .addMultipleChoiceItem()
      .setTitle(time)
      .setChoiceValues(["〇", "×", "△"])
      .setRequired(true)
  );

  const SHEET_RESPONSE_ID: string = SpreadsheetApp.create(
    `${title}(回答)`
  ).getId();
  form.setDestination(FormApp.DestinationType.SPREADSHEET, SHEET_RESPONSE_ID);
  form.setAllowResponseEdits(true);
  form.setShowLinkToRespondAgain(false);

  const SS_RESPONSE: GoogleAppsScript.Spreadsheet.Spreadsheet =
    SpreadsheetApp.openById(SHEET_RESPONSE_ID);
  const responseSheet: GoogleAppsScript.Spreadsheet.Sheet =
    SS_RESPONSE.getSheets()[0];
  responseSheet
    .getRange("G1")
    .setFormula(
      `=ARRAYFORMULA(IFNA(VLOOKUP(B1:B,IMPORTRANGE("${SHEET_MEMBER_LIST_ID}","名簿!A:G"),2,FALSE)))`
    );

  const SHEET_STATUS_ID: string = SpreadsheetApp.create(
    `${title}(回答状況)`
  ).getId();
  const SS_STATUS: GoogleAppsScript.Spreadsheet.Spreadsheet =
    SpreadsheetApp.openById(SHEET_STATUS_ID);
  const statusSheet: GoogleAppsScript.Spreadsheet.Sheet =
    SS_STATUS.getSheets()[0];
  statusSheet
    .getRange("A2")
    .setFormula(
      `=QUERY(IMPORTRANGE("${SHEET_RESPONSE_ID}","${responseSheet.getName()}!A:G"), "select Col7,Col3,Col4,Col5,Col6 where Col7 is not null order by Col2 label Col7 '名前', Col3 '16:00', Col4 '17:00', Col5 '18:00', Col6 '19:00'",1)`
    );
  statusSheet.deleteColumns(6, 21);
  statusSheet.setColumnWidths(2, 4, 50);
  const rule: GoogleAppsScript.Spreadsheet.ConditionalFormatRule =
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(15)
      .setBackground("#FF6D01")
      .setRanges([responseSheet.getRange("B1:E1")])
      .build();
  const rules: GoogleAppsScript.Spreadsheet.ConditionalFormatRule[] =
    statusSheet.getConditionalFormatRules();
  rules.push(rule);
  statusSheet.getRange("B2:E").setHorizontalAlignment("center");
  statusSheet.setName("回答状況");

  const IDs = {
    form: form.getId(),
    response: SHEET_RESPONSE_ID,
    status: SHEET_STATUS_ID,
  };
  return IDs;
};

const permitTemporary_ = (ssId: string): void => {
  const driver: GoogleAppsScript.Drive.File = DriveApp.getFileById(ssId);

  const accessOpen: GoogleAppsScript.Drive.Access =
    DriveApp.Access.ANYONE_WITH_LINK;
  const permissonOpen: GoogleAppsScript.Drive.Permission =
    DriveApp.Permission.VIEW;
  driver.setSharing(accessOpen, permissonOpen);

  SpreadsheetApp.flush();

  const accessClose: GoogleAppsScript.Drive.Access = DriveApp.Access.PRIVATE;
  const permissonClose: GoogleAppsScript.Drive.Permission =
    DriveApp.Permission.EDIT;
  driver.setSharing(accessClose, permissonClose);
};

const sendLine_ = (text: string): void => {
  const options = {
    method: "post",
    payload: { message: text },
    headers: { Authorization: `Bearer ${LINE_NOTIFY_TOKEN}` },
  };
  UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
};

const deleteTrigger_ = (functionName: string): void => {
  const triggers: GoogleAppsScript.Script.Trigger[] =
    ScriptApp.getScriptTriggers();
  triggers.forEach((trigger) => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
};
