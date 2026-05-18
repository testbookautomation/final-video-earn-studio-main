/*
  Testbook Creator Lab — Google Apps Script Webhook
  Deploy: Execute as Me · Who has access: Anyone
*/

var CONFIG = {
  SECRET_TOKEN:        "TB_UGC_SECRET_2025",
  SHEET_ID:            "1zEu7CtKhW3jsocPE1qR85xekiu_OBi7ZyJsRJY9yyaI",
  LMS_EMAIL:           "learning@testbook.com",
  LMS_PASSWORD:        "learning!@#book",
  LMS_LOGIN_URL:       "https://lms-api.testbook.com/api/v2/admin/login",
  LMS_PRESIGNED_URL_API: "https://lms-api.testbook.com/api/v2/pre-signed-upload?language=All",
  VIEW_TARGET:         5000
};

var SHEETS = {
  SUBMISSIONS: "Submissions",
  EVENTS:      "Events",
  USERS:       "Users",
  PAYOUT:      "Payout",
  REVIEW:      "Review & Pay"
};

var HEADERS = {
  SUBMISSIONS: [
    "Submission ID","Submitted At","User ID","Phone","Name","Email",
    "Exam Category","Platform","Video Link","Social Handle","Caption",
    "UPI ID","Followers","Consent","Status","Rejection Reason","Approved By",
    "Approved At","Views","Likes","Comments","Payout Eligibility",
    "Payout Amount","Payout Status","Razorpay ID","CDN URL",
    "Updated At","IP Address","Metadata JSON","Approve","Reject"
  ],
  EVENTS: [
    "Event ID","Timestamp","User ID","Phone","Event Name","Page","Platform","Payload","Session ID"
  ],
  USERS: [
    "User ID","Phone","Name","Email","Exam Category","UPI ID","First Seen","Last Seen","Submission Count"
  ],
  PAYOUT: [
    "Payout ID","Submission ID","User ID","Phone","UPI ID","Amount",
    "Status","Razorpay ID","Failure Reason","Created At","Updated At"
  ],
  REVIEW: [
    "Submission ID","Submitted At","Name","Phone","UPI ID","Email",
    "Exam Category","Platform","Followers","Video Link","Caption",
    "Status","Views","Likes","Comments","Milestone Reached","Payout Amount (₹)",
    "Payout Status","Approve","Reject","Rejection Reason","Payment Eligible","Reviewed By","Reviewed At"
  ]
};

/* ── Entry points ──────────────────────────────────────────── */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!verifyToken(body.token)) return json({ success: false, error: "Unauthorized" });
    if (body.type === "submit") return json(handleSubmit(body));
    if (body.type === "event")  return json(handleEvent(body));
    return json({ success: false, error: "Unknown type: " + (body.type || "") });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};
    if (!verifyToken(p.token)) return json({ success: false, error: "Unauthorized" });
    if (p.type === "ping")        return json({ success: true, message: "OK", timestamp: new Date().toISOString() });
    if (p.type === "status")      return json(handleStatus(p.phone, p.userId, p.submissionId));
    if (p.type === "sync-review") return json(handleSyncReview());
    if (p.type === "debug")       return json(handleDebug());
    return json({ success: false, error: "Unknown type" });
  } catch (err) {
    return json({ success: false, error: String(err) });
  }
}

/* ── Submit ────────────────────────────────────────────────── */

function handleSubmit(data) {
  var name         = safeStr(data.name);
  var phone        = normalizePhone(data.phone);
  var userId       = safeStr(data.userId) || phone;
  var email        = safeStr(data.email);
  var upi          = safeStr(data.upi);
  var examCategory = safeStr(data.examCategory);
  var platform     = safeStr(data.platform);
  var videoLink    = safeStr(data.videoLink);
  var socialHandle = safeStr(data.socialHandle);
  var caption      = safeStr(data.caption);
  var followers    = safeStr(data.followers);
  var consent      = data.consent === true || data.consent === "true";

  if (!name)    return { success: false, error: "name is required" };
  if (!phone || phone.length !== 10) return { success: false, error: "valid 10-digit phone required" };
  if (!videoLink) return { success: false, error: "videoLink is required" };
  if (!consent) return { success: false, error: "consent is required" };

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var sheet = getOrCreateSheet(SHEETS.SUBMISSIONS, HEADERS.SUBMISSIONS);
    ensureHeaders(sheet, HEADERS.SUBMISSIONS);

    if (isDuplicateSubmission(sheet, videoLink)) {
      return { success: false, error: "duplicate", message: "This video has already been submitted." };
    }

    var submissionId = generateId("TB");
    var now = new Date().toISOString();
    var meta = typeof data.metadata === "object" ? data.metadata : {};

    sheet.appendRow([
      submissionId, now, userId, phone, name, email,
      examCategory, platform, videoLink, socialHandle, caption,
      upi, followers, consent ? "Yes" : "No",
      "Under Review", "", "", "",
      0, 0, 0, "Not Eligible", 0, "Pending", "",
      videoLink, now,
      safeStr(meta.ip || ""),
      JSON.stringify(meta),
      false, false
    ]);

    upsertUser({ userId: userId, phone: phone, name: name, email: email, examCategory: examCategory, upi: upi });

    // Add to Review & Pay sheet immediately
    addToReviewSheet({
      submissionId: submissionId, now: now, name: name, phone: phone,
      upi: upi, email: email, examCategory: examCategory, platform: platform,
      followers: followers, videoLink: videoLink, caption: caption
    });

    return { success: true, submissionId: submissionId, status: "Under Review" };
  } finally {
    lock.releaseLock();
  }
}

/* ── Review & Pay sheet ────────────────────────────────────── */

function addToReviewSheet(d) {
  var sheet = getOrCreateSheet(SHEETS.REVIEW, HEADERS.REVIEW);
  ensureHeaders(sheet, HEADERS.REVIEW);
  sheet.appendRow([
    d.submissionId, d.now, d.name, d.phone, d.upi, d.email,
    d.examCategory, d.platform, d.followers, d.videoLink, d.caption,
    "Under Review", 0, 0, 0, "None", 0,
    "Pending", false, false, "", false, "", ""
  ]);
  // Format last added row
  var lastRow = sheet.getLastRow();
  var col = headerIndex(sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]);
  // Hyperlink for video
  if (d.videoLink && col["Video Link"] !== undefined) {
    sheet.getRange(lastRow, col["Video Link"]+1).setFormula('=HYPERLINK("' + d.videoLink + '","▶ Watch")');
  }
}

function syncReviewSheet() {
  var ss       = getSpreadsheet();
  var subSheet = ss.getSheetByName(SHEETS.SUBMISSIONS);
  if (!subSheet) return;

  var reviewSheet = getOrCreateSheet(SHEETS.REVIEW, HEADERS.REVIEW);
  ensureHeaders(reviewSheet, HEADERS.REVIEW);

  var subRows = subSheet.getDataRange().getValues();
  if (subRows.length <= 1) return;

  var sCol = headerIndex(subRows[0]);
  var rCol = headerIndex(reviewSheet.getRange(1,1,1,reviewSheet.getLastColumn()).getValues()[0]);

  // Build index of existing submission IDs in Review sheet
  var reviewRows = reviewSheet.getDataRange().getValues();
  var existing   = {};
  for (var i = 1; i < reviewRows.length; i++) {
    existing[String(reviewRows[i][rCol["Submission ID"]])] = i + 1; // 1-based row
  }

  for (var r = 1; r < subRows.length; r++) {
    var row  = subRows[r];
    var sid  = String(row[sCol["Submission ID"]]);
    var views = Number(row[sCol["Views"]]) || 0;
    var milestone = getMilestone(views);
    var payoutAmount = Number(row[sCol["Payout Amount"]]) || getPayoutAmount(views);
    var payEligible = String(row[sCol["Payout Eligibility"]]) === "Eligible";

    if (existing[sid]) {
      // Update status, metrics, payout in existing row
      var rRow = existing[sid];
      reviewSheet.getRange(rRow, rCol["Status"]+1).setValue(row[sCol["Status"]]);
      reviewSheet.getRange(rRow, rCol["Views"]+1).setValue(views);
      reviewSheet.getRange(rRow, rCol["Likes"]+1).setValue(Number(row[sCol["Likes"]]) || 0);
      reviewSheet.getRange(rRow, rCol["Comments"]+1).setValue(Number(row[sCol["Comments"]]) || 0);
      reviewSheet.getRange(rRow, rCol["Milestone Reached"]+1).setValue(milestone);
      reviewSheet.getRange(rRow, rCol["Payout Amount (₹)"]+1).setValue(payoutAmount);
      reviewSheet.getRange(rRow, rCol["Payout Status"]+1).setValue(row[sCol["Payout Status"]]);
      reviewSheet.getRange(rRow, rCol["Rejection Reason"]+1).setValue(row[sCol["Rejection Reason"]]);
      reviewSheet.getRange(rRow, rCol["Reviewed By"]+1).setValue(row[sCol["Approved By"]]);
      reviewSheet.getRange(rRow, rCol["Reviewed At"]+1).setValue(row[sCol["Approved At"]]);
      if (rCol["Payment Eligible"] !== undefined) {
        reviewSheet.getRange(rRow, rCol["Payment Eligible"]+1).setValue(payEligible);
      }
    } else {
      // New row
      var videoLink = String(row[sCol["Video Link"]] || "");
      reviewSheet.appendRow([
        sid,
        row[sCol["Submitted At"]],
        row[sCol["Name"]],
        row[sCol["Phone"]],
        row[sCol["UPI ID"]],
        row[sCol["Email"]],
        row[sCol["Exam Category"]],
        row[sCol["Platform"]],
        row[sCol["Followers"]],
        videoLink,
        row[sCol["Caption"]],
        row[sCol["Status"]],
        views,
        Number(row[sCol["Likes"]]) || 0,
        Number(row[sCol["Comments"]]) || 0,
        milestone,
        payoutAmount,
        row[sCol["Payout Status"]],
        false, false,
        row[sCol["Rejection Reason"]],
        payEligible,
        row[sCol["Approved By"]],
        row[sCol["Approved At"]]
      ]);
      if (videoLink) {
        var nr = reviewSheet.getLastRow();
        reviewSheet.getRange(nr, rCol["Video Link"]+1).setFormula('=HYPERLINK("' + videoLink + '","▶ Watch")');
      }
    }
  }
  SpreadsheetApp.flush();
}

function getMilestone(views) {
  if (views >= 1000000) return "10L — ₹25,000";
  if (views >= 500000)  return "5L — ₹15,000";
  if (views >= 100000)  return "1L — ₹6,000";
  if (views >= 50000)   return "50K — ₹2,500";
  if (views >= 10000)   return "10K — ₹500";
  return "None";
}

function getPayoutAmount(views) {
  var n = Number(views) || 0;
  var amount = 0;
  if (n >= 10000)   amount += 500;
  if (n >= 50000)   amount += 2500;
  if (n >= 100000)  amount += 6000;
  if (n >= 500000)  amount += 15000;
  if (n >= 1000000) amount += 25000;
  return amount;
}

/* ── onEdit: handle Review & Pay checkboxes ────────────────── */

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    var sheet     = e.range.getSheet();
    var sheetName = sheet.getName();

    if (sheetName === SHEETS.SUBMISSIONS) handleSubmissionsEdit(e, sheet);
    if (sheetName === SHEETS.REVIEW)      handleReviewEdit(e, sheet);
  } catch (err) {
    console.error("onEdit error: " + err);
  }
}

function handleSubmissionsEdit(e, sheet) {
  if (e.range.getRow() === 1 || String(e.value).toUpperCase() !== "TRUE") return;
  var headers    = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  var col        = headerIndex(headers);
  var editedCol  = e.range.getColumn();
  var approveCol = col["Approve"] !== undefined ? col["Approve"] + 1 : 0;
  var rejectCol  = col["Reject"]  !== undefined ? col["Reject"]  + 1 : 0;
  if (editedCol !== approveCol && editedCol !== rejectCol) return;

  var rowIndex = e.range.getRow();
  var status   = editedCol === approveCol ? "Approved" : "Rejected";
  var now      = new Date().toISOString();
  var reviewer = getReviewer();

  setCell(sheet, rowIndex, col, "Status",      status);
  setCell(sheet, rowIndex, col, "Approved By", reviewer);
  setCell(sheet, rowIndex, col, "Approved At", now);
  setCell(sheet, rowIndex, col, "Updated At",  now);
  if (status === "Approved") {
    setCell(sheet, rowIndex, col, "Payout Eligibility", "Eligible");
    if (rejectCol) sheet.getRange(rowIndex, rejectCol).setValue(false);
  }
  if (status === "Rejected" && approveCol) {
    sheet.getRange(rowIndex, approveCol).setValue(false);
  }

  var sid = getCellVal(sheet, rowIndex, col, "Submission ID");
  var reason = status === "Rejected" ? getCellVal(sheet, rowIndex, col, "Rejection Reason") : "";
  mirrorStatusToReview(sheet, rowIndex, col, status, now, reviewer, reason);
}

function handleReviewEdit(e, sheet) {
  if (e.range.getRow() === 1) return;
  var headers       = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  var col           = headerIndex(headers);
  var editedCol     = e.range.getColumn();
  var rowIndex      = e.range.getRow();
  var now           = new Date().toISOString();
  var reviewer      = getReviewer();
  var newVal        = String(e.value).toUpperCase();

  var approveCol    = col["Approve"]          !== undefined ? col["Approve"]          + 1 : 0;
  var rejectCol     = col["Reject"]           !== undefined ? col["Reject"]           + 1 : 0;
  var payEligCol    = col["Payment Eligible"] !== undefined ? col["Payment Eligible"] + 1 : 0;

  if (newVal !== "TRUE") return; // only act on tick, not untick

  var sid = getCellVal(sheet, rowIndex, col, "Submission ID");

  if (editedCol === approveCol) {
    // ── Video Approved ──────────────────────────────────────
    setCell(sheet, rowIndex, col, "Status",      "Approved");
    setCell(sheet, rowIndex, col, "Reviewed By", reviewer);
    setCell(sheet, rowIndex, col, "Reviewed At", now);
    if (rejectCol) sheet.getRange(rowIndex, rejectCol).setValue(false);
    mirrorStatusToSubmissions(sid, "Approved", now, reviewer, "", "Eligible");

  } else if (editedCol === rejectCol) {
    // ── Video Rejected ──────────────────────────────────────
    var reason = getCellVal(sheet, rowIndex, col, "Rejection Reason");
    setCell(sheet, rowIndex, col, "Status",      "Rejected");
    setCell(sheet, rowIndex, col, "Reviewed By", reviewer);
    setCell(sheet, rowIndex, col, "Reviewed At", now);
    if (approveCol) sheet.getRange(rowIndex, approveCol).setValue(false);
    // Clear Payment Eligible since video was rejected
    if (payEligCol) sheet.getRange(rowIndex, payEligCol).setValue(false);
    mirrorStatusToSubmissions(sid, "Rejected", now, reviewer, reason, "");

  } else if (editedCol === payEligCol) {
    // ── Payment Eligible ────────────────────────────────────
    var views = Number(getCellVal(sheet, rowIndex, col, "Views")) || 0;
    var payoutAmount = Number(getCellVal(sheet, rowIndex, col, "Payout Amount (₹)")) || getPayoutAmount(views);
    setCell(sheet, rowIndex, col, "Payout Amount (₹)", payoutAmount);
    setCell(sheet, rowIndex, col, "Payout Status", "Processing");
    mirrorPaymentEligible(sid, payoutAmount, now);
  }
}

function mirrorStatusToReview(subSheet, rowIndex, col, status, now, reviewer, reason) {
  var sid = getCellVal(subSheet, rowIndex, col, "Submission ID");
  var reviewSheet = getSpreadsheet().getSheetByName(SHEETS.REVIEW);
  if (!reviewSheet) return;
  var rows = reviewSheet.getDataRange().getValues();
  var rCol = headerIndex(rows[0]);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][rCol["Submission ID"]]) === sid) {
      reviewSheet.getRange(i+1, rCol["Status"]+1).setValue(status);
      reviewSheet.getRange(i+1, rCol["Reviewed By"]+1).setValue(reviewer);
      reviewSheet.getRange(i+1, rCol["Reviewed At"]+1).setValue(now);
      if (reason !== undefined && rCol["Rejection Reason"] !== undefined) {
        reviewSheet.getRange(i+1, rCol["Rejection Reason"]+1).setValue(reason);
      }
      break;
    }
  }
}

function mirrorStatusToSubmissions(sid, status, now, reviewer, rejectionReason, payoutEligibility) {
  var subSheet = getSpreadsheet().getSheetByName(SHEETS.SUBMISSIONS);
  if (!subSheet) return;
  var rows = subSheet.getDataRange().getValues();
  var col  = headerIndex(rows[0]);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][col["Submission ID"]]) === sid) {
      setCell(subSheet, i+1, col, "Status",      status);
      setCell(subSheet, i+1, col, "Approved By", reviewer);
      setCell(subSheet, i+1, col, "Approved At", now);
      setCell(subSheet, i+1, col, "Updated At",  now);
      if (rejectionReason !== undefined) {
        setCell(subSheet, i+1, col, "Rejection Reason", rejectionReason);
      }
      if (payoutEligibility) {
        setCell(subSheet, i+1, col, "Payout Eligibility", payoutEligibility);
      }
      break;
    }
  }
}

function mirrorPaymentEligible(sid, payoutAmount, now) {
  var subSheet = getSpreadsheet().getSheetByName(SHEETS.SUBMISSIONS);
  if (!subSheet) return;
  var rows = subSheet.getDataRange().getValues();
  var col  = headerIndex(rows[0]);
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][col["Submission ID"]]) === sid) {
      setCell(subSheet, i+1, col, "Status",             "Milestone Reached");
      setCell(subSheet, i+1, col, "Payout Eligibility", "Eligible");
      if (payoutAmount > 0) {
        setCell(subSheet, i+1, col, "Payout Amount", payoutAmount);
      }
      setCell(subSheet, i+1, col, "Payout Status", "Processing");
      setCell(subSheet, i+1, col, "Updated At",    now);
      break;
    }
  }
}

/* ── Event ─────────────────────────────────────────────────── */

function handleEvent(data) {
  var eventName = safeStr(data.eventName);
  if (!eventName) return { success: false, error: "eventName is required" };

  var sheet = getOrCreateSheet(SHEETS.EVENTS, HEADERS.EVENTS);
  ensureHeaders(sheet, HEADERS.EVENTS);

  var eventId = generateId("EVT");
  sheet.appendRow([
    eventId, new Date().toISOString(),
    safeStr(data.userId), normalizePhone(data.phone),
    eventName, safeStr(data.page), safeStr(data.platform),
    JSON.stringify(data.payload || {}),
    safeStr(data.sessionId)
  ]);

  return { success: true, eventId: eventId };
}

/* ── Status ────────────────────────────────────────────────── */

function handleStatus(phone, userId, submissionId) {
  var nSid    = safeStr(submissionId);
  var nPhone  = normalizePhone(phone);
  var nUserId = safeStr(userId);
  if (!nSid && !nPhone && !nUserId) return { success: false, error: "submissionId, phone, or userId required" };

  var ss = getSpreadsheet();

  // ── 1. Read from Review & Pay sheet (admin acts here directly) ──
  var reviewSheet = ss.getSheetByName(SHEETS.REVIEW);
  var reviewResult = null;
  if (reviewSheet) {
    var rRows = reviewSheet.getDataRange().getValues();
    if (rRows.length > 1) {
      var rCol = headerIndex(rRows[0]);
      for (var ri = rRows.length - 1; ri >= 1; ri--) {
        var rRow   = rRows[ri];
        var rSid   = safeStr(rRow[rCol["Submission ID"]]);
        var rPhone = normalizePhone(String(rRow[rCol["Phone"]] || ""));
        // Match by submissionId first, fall back to phone
        var matched = (nSid && rSid === nSid) || (!nSid && nPhone && rPhone === nPhone);
        if (!matched) continue;

        var rStatus      = safeStr(rRow[rCol["Status"]]);
        var rReason      = safeStr(rRow[rCol["Rejection Reason"]]);
        var rPayElig     = rRow[rCol["Payment Eligible"]] === true;
        var rPayStatus   = safeStr(rRow[rCol["Payout Status"]]);
        var rViews       = Number(rRow[rCol["Views"]])    || 0;
        var rPayAmt      = Number(rRow[rCol["Payout Amount (₹)"]]) || getPayoutAmount(rViews);
        var rLikes       = Number(rRow[rCol["Likes"]])    || 0;
        var rComments    = Number(rRow[rCol["Comments"]]) || 0;
        var rUpi         = safeStr(rRow[rCol["UPI ID"]]);
        var rSid         = safeStr(rRow[rCol["Submission ID"]]);

        // Derive eligibility: explicit checkbox OR status is Approved/Paid/Milestone Reached
        var eligibility = rPayElig || rStatus === "Approved" || rStatus === "Paid" || rStatus === "Milestone Reached"
          ? "Eligible" : "Not Eligible";

        reviewResult = {
          submissionId:    rSid,
          status:          rStatus,
          rejectionReason: rReason,
          metrics: { views: rViews, likes: rLikes, comments: rComments, target: CONFIG.VIEW_TARGET },
          payout:  { upi: rUpi, eligibility: eligibility, amount: rPayAmt, status: rPayStatus }
        };

        // Also mirror the updated status back to Submissions sheet so it stays in sync
        if (rStatus) mirrorStatusToSubmissions(rSid, rStatus, new Date().toISOString(), "auto-sync", rReason, eligibility);
        break;
      }
    }
  }

  if (reviewResult) return { success: true, submission: reviewResult };

  // ── 2. Fall back to Submissions sheet ──
  var subSheet = ss.getSheetByName(SHEETS.SUBMISSIONS);
  if (!subSheet) return { success: true, submission: null };

  var rows = subSheet.getDataRange().getValues();
  if (rows.length <= 1) return { success: true, submission: null };
  var col = headerIndex(rows[0]);

  for (var i = rows.length - 1; i >= 1; i--) {
    var row      = rows[i];
    var rowSid   = safeStr(row[col["Submission ID"]]);
    var rowPhone = normalizePhone(String(row[col["Phone"]] || ""));
    var rowUser  = safeStr(row[col["User ID"]]);
    if ((nSid && rowSid === nSid) || (nPhone && rowPhone === nPhone) || (nUserId && rowUser === nUserId)) {
      var views = Number(row[col["Views"]]) || 0;
      return {
        success: true,
        submission: {
          submissionId:    row[col["Submission ID"]],
          status:          row[col["Status"]],
          rejectionReason: row[col["Rejection Reason"]],
          metrics: {
            views:    views,
            likes:    Number(row[col["Likes"]])    || 0,
            comments: Number(row[col["Comments"]]) || 0,
            target:   CONFIG.VIEW_TARGET
          },
          payout: {
            upi:         row[col["UPI ID"]],
            eligibility: row[col["Payout Eligibility"]],
            amount:      Number(row[col["Payout Amount"]]) || getPayoutAmount(views),
            status:      row[col["Payout Status"]],
            razorpayId:  row[col["Razorpay ID"]]
          }
        }
      };
    }
  }
  return { success: true, submission: null };
}

function handleSyncReview() {
  try {
    syncReviewSheet();
    var reviewSheet = getSpreadsheet().getSheetByName(SHEETS.REVIEW);
    var count = reviewSheet ? Math.max(reviewSheet.getLastRow() - 1, 0) : 0;
    return { success: true, message: "Sync complete", rows: count };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/* ── Helpers ───────────────────────────────────────────────── */

function getCellVal(sheet, rowIndex, col, header) {
  if (col[header] === undefined) return "";
  return safeStr(sheet.getRange(rowIndex, col[header]+1).getValue());
}

function upsertUser(data) {
  var sheet = getOrCreateSheet(SHEETS.USERS, HEADERS.USERS);
  ensureHeaders(sheet, HEADERS.USERS);
  var rows = sheet.getDataRange().getValues();
  var col  = headerIndex(rows[0]);
  var now  = new Date().toISOString();

  for (var i = 1; i < rows.length; i++) {
    if (normalizePhone(String(rows[i][col["Phone"]] || "")) === data.phone) {
      sheet.getRange(i+1, col["User ID"]+1).setValue(data.userId);
      sheet.getRange(i+1, col["Name"]+1).setValue(data.name);
      sheet.getRange(i+1, col["Email"]+1).setValue(data.email);
      sheet.getRange(i+1, col["Exam Category"]+1).setValue(data.examCategory);
      if (data.upi) sheet.getRange(i+1, col["UPI ID"]+1).setValue(data.upi);
      sheet.getRange(i+1, col["Last Seen"]+1).setValue(now);
      sheet.getRange(i+1, col["Submission Count"]+1).setValue(Number(rows[i][col["Submission Count"]]) + 1);
      return;
    }
  }
  sheet.appendRow([data.userId, data.phone, data.name, data.email, data.examCategory, data.upi || "", now, now, 1]);
}

function isDuplicateSubmission(sheet, videoLink) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return false;
  var col  = headerIndex(rows[0]);
  var link = String(videoLink).toLowerCase();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][col["Video Link"]] || "").toLowerCase() === link) return true;
  }
  return false;
}

function setCell(sheet, rowIndex, col, header, value) {
  if (col[header] === undefined) return;
  sheet.getRange(rowIndex, col[header]+1).setValue(value);
}

function getReviewer() {
  try { return Session.getActiveUser().getEmail() || "Sheet user"; } catch(e) { return "Sheet user"; }
}

function getSpreadsheet() {
  return CONFIG.SHEET_ID ? SpreadsheetApp.openById(CONFIG.SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet(name, headers) {
  var ss    = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeader(sheet, headers.length);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ensureHeaders(sheet, headers) {
  var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  var changed  = false;
  for (var i = 0; i < headers.length; i++) {
    if (existing[i] !== headers[i]) { existing[i] = headers[i]; changed = true; }
  }
  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    formatHeader(sheet, headers.length);
  }
}

function formatHeader(sheet, count) {
  sheet.getRange(1, 1, 1, count)
    .setFontWeight("bold")
    .setBackground("#0B2F6B")
    .setFontColor("#ffffff");
}

function headerIndex(headers) {
  var m = {};
  for (var i = 0; i < headers.length; i++) m[String(headers[i])] = i;
  return m;
}

function verifyToken(token) { return safeStr(token) === CONFIG.SECRET_TOKEN; }

function generateId(prefix) {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var id = prefix + "-";
  for (var i = 0; i < 7; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function normalizePhone(value) {
  var d = safeStr(value).replace(/\D/g, "");
  if (d.length > 10 && d.indexOf("91") === 0) d = d.slice(d.length - 10);
  return d.slice(-10);
}

function safeStr(v) {
  return (v === null || v === undefined) ? "" : String(v).trim();
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function handleDebug() {
  var ss = getSpreadsheet();
  var info = {};
  Object.keys(SHEETS).forEach(function(key) {
    var s = ss.getSheetByName(SHEETS[key]);
    info[SHEETS[key]] = s ? { rows: s.getLastRow(), cols: s.getLastColumn() } : null;
  });
  return { success: true, sheets: info, timestamp: new Date().toISOString() };
}

/* ── Setup (run once) ──────────────────────────────────────── */

function setupSheets() {
  // Create all sheets
  Object.keys(SHEETS).forEach(function(key) {
    var s = getOrCreateSheet(SHEETS[key], HEADERS[key]);
    ensureHeaders(s, HEADERS[key]);
  });

  // Dropdowns on Submissions
  var subSheet = getOrCreateSheet(SHEETS.SUBMISSIONS, HEADERS.SUBMISSIONS);
  var subCol   = headerIndex(subSheet.getRange(1,1,1,subSheet.getLastColumn()).getValues()[0]);
  applyDropdown(subSheet, subCol, "Status",             ["Under Review","Approved","Rejected","Live","Milestone Reached","Paid"]);
  applyDropdown(subSheet, subCol, "Payout Eligibility", ["Not Eligible","Eligible"]);
  applyDropdown(subSheet, subCol, "Payout Status",      ["Pending","Processing","Paid","Failed"]);
  applyCheckboxes(subSheet, subCol, "Approve");
  applyCheckboxes(subSheet, subCol, "Reject");

  // Dropdowns + checkboxes on Review & Pay
  var revSheet = getOrCreateSheet(SHEETS.REVIEW, HEADERS.REVIEW);
  var revCol   = headerIndex(revSheet.getRange(1,1,1,revSheet.getLastColumn()).getValues()[0]);
  applyDropdown(revSheet, revCol, "Status",        ["Under Review","Approved","Rejected","Live","Milestone Reached","Paid"]);
  applyDropdown(revSheet, revCol, "Payout Status", ["Pending","Processing","Paid","Failed"]);
  applyCheckboxes(revSheet, revCol, "Approve");
  applyCheckboxes(revSheet, revCol, "Reject");
  applyCheckboxes(revSheet, revCol, "Payment Eligible");

  // Column widths on Review & Pay
  revSheet.setColumnWidth(revCol["Name"]+1,             160);
  revSheet.setColumnWidth(revCol["Phone"]+1,            120);
  revSheet.setColumnWidth(revCol["UPI ID"]+1,           180);
  revSheet.setColumnWidth(revCol["Video Link"]+1,       100);
  revSheet.setColumnWidth(revCol["Caption"]+1,          250);
  revSheet.setColumnWidth(revCol["Status"]+1,           130);
  revSheet.setColumnWidth(revCol["Payout Status"]+1,    130);
  revSheet.setColumnWidth(revCol["Rejection Reason"]+1, 220);
  revSheet.setColumnWidth(revCol["Payment Eligible"]+1, 130);

  // Conditional formatting: Approved rows → light green bg
  var range = revSheet.getRange(2, 1, Math.max(revSheet.getMaxRows()-1,1), revSheet.getLastColumn());
  var approvedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$L2="Approved"')
    .setBackground("#e6f4ea")
    .setRanges([range])
    .build();
  var rejectedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$L2="Rejected"')
    .setBackground("#fce8e6")
    .setRanges([range])
    .build();
  var payEligRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$V2=TRUE')
    .setBackground("#e8f5e9")
    .setRanges([range])
    .build();
  revSheet.setConditionalFormatRules([approvedRule, rejectedRule, payEligRule]);

  // Install onEdit trigger once
  var triggers = ScriptApp.getProjectTriggers();
  var hasEdit  = triggers.some(function(t) { return t.getHandlerFunction() === "onEdit"; });
  if (!hasEdit) {
    ScriptApp.newTrigger("onEdit").forSpreadsheet(getSpreadsheet()).onEdit().create();
  }

  // Install hourly sync trigger for Review & Pay
  var hasSync = triggers.some(function(t) { return t.getHandlerFunction() === "syncReviewSheet"; });
  if (!hasSync) {
    ScriptApp.newTrigger("syncReviewSheet").timeBased().everyHours(1).create();
  }

  SpreadsheetApp.flush();
  getSpreadsheet().toast("All sheets ready!", "Setup complete", 5);
}

function applyDropdown(sheet, col, header, list) {
  if (col[header] === undefined) return;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
  sheet.getRange(2, col[header]+1, Math.max(sheet.getMaxRows()-1, 1), 1).setDataValidation(rule);
}

function applyCheckboxes(sheet, col, header) {
  if (col[header] === undefined) return;
  sheet.getRange(2, col[header]+1, Math.max(sheet.getMaxRows()-1, 1), 1).insertCheckboxes();
}

/* ── Tests ─────────────────────────────────────────────────── */

function testSubmit() {
  Logger.log(JSON.stringify(handleSubmit({
    token: CONFIG.SECRET_TOKEN, type: "submit",
    name: "Test User", phone: "9999999999", userId: "test-001",
    email: "test@example.com", upi: "test@okhdfc",
    examCategory: "SSC CGL", platform: "instagram",
    videoLink: "https://youtube.com/shorts/test-" + Date.now(),
    socialHandle: "@testuser", caption: "Test caption #TestbookPass",
    followers: "5000", consent: true
  })));
}

function testEvent() {
  Logger.log(JSON.stringify(handleEvent({
    token: CONFIG.SECRET_TOKEN, type: "event",
    eventName: "page_view", sessionId: "test-session-001", userId: "9999999999", phone: "9999999999",
    page: "/", platform: "", payload: { source: "test" }
  })));
}

function testStatus() {
  Logger.log(JSON.stringify(handleStatus("9999999999", "")));
}

function testSync() {
  syncReviewSheet();
  Logger.log("Sync done.");
}
