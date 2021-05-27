/* eslint-disable @typescript-eslint/no-unused-vars */
const setForm = () => {
  const dt = new Date();
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
    DriveApp.Access.PRIVATE,
    DriveApp.Permission.EDIT
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
