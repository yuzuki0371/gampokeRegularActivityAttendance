/* eslint-disable @typescript-eslint/no-unused-vars */
const setForm = (): void => {
  const dt: GoogleAppsScript.Base.Date = new Date();
  dt.setDate(dt.getDate() + 7);

  const event: false | GoogleAppsScript.Calendar.CalendarEvent =
    hasActivity_(dt);
  if (event === false) {
    return;
  }

  const title: string = Utilities.formatDate(dt, "JST", "yyyy年MM月dd日(E)");
  const IDs = createForm_(title, event);
  const destination: GoogleAppsScript.Drive.Folder =
    DriveApp.getFolderById(FOLDER_ID);
  Object.keys(IDs).forEach((ID) => {
    DriveApp.getFolderById(IDs[ID]).moveTo(destination);
  });

  permitTemporary_(SHEET_MEMBER_LIST_ID);
  permitTemporary_(IDs.response);
  DriveApp.getFileById(IDs.status).setSharing(
    DriveApp.Access.ANYONE_WITH_LINK,
    DriveApp.Permission.VIEW
  );

  const message = `【定期活動連絡】
  ${Utilities.formatDate(
    dt,
    "JST",
    "M月d日"
  )}の定期活動に参加を希望される方はフォームにて回答をお願いします。
  ${FormApp.openById(IDs.form).getPublishedUrl()}
  【回答状況】
  ${SpreadsheetApp.openById(IDs.status).getUrl()}`;
  sendLine_(message);

  deleteTrigger_("setForm");

  const day = getDay_(dt);
  const properties = {
    [`${day}_FORM`]: IDs.form,
    [`${day}_SS`]: IDs.status,
  };

  PropertiesService.getScriptProperties().setProperties(properties);
};

const closeForm = (): void => {
  const dt: GoogleAppsScript.Base.Date = new Date();
  const day:
    | "SUNDAY"
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY" = getDay_(dt);
  const FORM_ID: string | null =
    PropertiesService.getScriptProperties().getProperty(`${day}_FORM`);
  const SS_ID: string | null =
    PropertiesService.getScriptProperties().getProperty(`${day}_SS`);

  if (FORM_ID === null) return;
  if (SS_ID === null) return;

  const form: GoogleAppsScript.Forms.Form = FormApp.openById(FORM_ID);
  form.setAcceptingResponses(false);

  const ss: GoogleAppsScript.Spreadsheet.Spreadsheet =
    SpreadsheetApp.openById(SS_ID);
  const message = `【定期活動連絡】
  本日の活動の出席確認の受付を終了しました。
  【回答状況】
  ${ss.getUrl()}
  【業務連絡】
  担当者は回答状況を確認し、活動参加者を確定してください。`;
  sendLine_(message);

  PropertiesService.getScriptProperties().deleteProperty(`${day}_FORM`);
  PropertiesService.getScriptProperties().deleteProperty(`${day}_SS`);
};

const setTrigger = (): void => {
  const dt: GoogleAppsScript.Base.Date = new Date();
  dt.setHours(9);
  dt.setMinutes(0);
  ScriptApp.newTrigger("closeForm").timeBased().at(dt).create();

  dt.setMinutes(5);
  ScriptApp.newTrigger("setForm").timeBased().at(dt).create();
};

const main = (): void => {
  closeForm();
  setForm();
}
