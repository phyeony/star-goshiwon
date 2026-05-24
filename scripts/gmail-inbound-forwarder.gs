/**
 * Google Apps Script forwarder for importing Gmail inbox messages into
 * /api/inbound-email.
 *
 * Setup:
 * 1. Create a new Apps Script at https://script.google.com/ while logged in
 *    as the Gmail inbox you want to import.
 * 2. Paste this file into Code.gs.
 * 3. Fill PROD_WEBHOOK_SECRET and STAGING_WEBHOOK_SECRET below.
 * 4. Run forwardRecentInboundEmailsProd() once manually and confirm success
 *    in Apps Script Executions.
 * 5. Run installProdTenMinuteTrigger() once for production.
 *
 * Staging can use a separate Gmail inbox. Keep its trigger separate from
 * production and use a separate processed label/property store.
 */

var PROD_CONFIG = {
  mailboxEmail: "stargoshiwon.seoul@gmail.com",
  webhookUrl: "https://goshiwonseoul.com/api/inbound-email",
  webhookSecret: "replace-with-production-INBOUND_EMAIL_WEBHOOK_SECRET",
  processedLabelName: "goshiwon-imported-prod",
  processedPropertyName: "PROCESSED_MESSAGE_IDS_PROD",
  query: "in:inbox newer_than:7d -from:stargoshiwon.seoul@gmail.com",
  maxThreads: 50,
};

var STAGING_CONFIG = {
  mailboxEmail: "phyeony@gmail.com",
  webhookUrl: "https://staging.goshiwonseoul.com/api/inbound-email",
  webhookSecret: "replace-with-staging-INBOUND_EMAIL_WEBHOOK_SECRET",
  processedLabelName: "goshiwon-imported-staging",
  processedPropertyName: "PROCESSED_MESSAGE_IDS_STAGING",
  query: "in:inbox newer_than:7d -from:phyeony@gmail.com",
  maxThreads: 20,
};

var BLOCKED_SENDER_DOMAINS = [
  "paypal.com",
  "paypal.co.kr",
  "naver.com",
  "whatsapp.com",
  "facebookmail.com",
  "google.com",
  "accounts.google.com",
  "instagram.com",
  "kakao.com",
  "daum.net",
];

var BLOCKED_SENDER_PATTERNS = [
  /mailer-daemon/i,
  /postmaster/i,
  /(^|[-_.])no-?reply($|[-_.@])/i,
  /(^|[-_.])noreply($|[-_.@])/i,
  /notification/i,
  /notifications/i,
  /newsletter/i,
  /marketing/i,
  /support@paypal/i,
];

function installProdTenMinuteTrigger() {
  installTrigger_("forwardRecentInboundEmailsProd", 10);
}

function installStagingTenMinuteTrigger() {
  // Only use this temporarily. Staging imports should normally be manual.
  installTrigger_("forwardRecentInboundEmailsStaging", 10);
}

function forwardRecentInboundEmailsProd() {
  forwardRecentInboundEmails_(PROD_CONFIG);
}

function forwardRecentInboundEmailsStaging() {
  forwardRecentInboundEmails_(STAGING_CONFIG);
}

function forwardRecentInboundEmails_(config) {
  validateConfig_(config);

  var processedLabel = getOrCreateLabel_(config.processedLabelName);
  var processed = loadProcessedMessageIds_(config.processedPropertyName);
  var threads = GmailApp.search(config.query, 0, config.maxThreads || 50);
  console.log("Found " + threads.length + " threads for " + config.webhookUrl);

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();
    var importedAnyMessage = false;

    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      if (!shouldImportMessage_(config, message)) continue;
      if (processed[message.getId()]) continue;

      var response = postInboundEmail_(config, thread, message);
      var status = response.getResponseCode();
      var body = response.getContentText();
      console.log(
        "Webhook response for Gmail message " +
          message.getId() +
          ": " +
          status +
          " " +
          body,
      );

      if (status >= 200 && status < 300) {
        importedAnyMessage = true;
        processed[message.getId()] = Date.now();
      } else {
        throw new Error(
          "Inbound email import failed for Gmail message " +
            message.getId() +
            ": " +
            status +
            " " +
            body,
        );
      }
    }

    if (importedAnyMessage) {
      thread.addLabel(processedLabel);
    }
  }

  saveProcessedMessageIds_(config.processedPropertyName, processed);
}

function postInboundEmail_(config, thread, message) {
  return UrlFetchApp.fetch(config.webhookUrl, {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-inbound-email-secret": config.webhookSecret,
    },
    payload: JSON.stringify(buildPayload_(config, thread, message)),
    muteHttpExceptions: true,
  });
}

function buildPayload_(config, thread, message) {
  var sender = parseAddress_(message.getFrom());
  var recipient = parseAddress_(message.getTo());

  return {
    messageId: "gmail:" + message.getId(),
    fromEmail: sender.email,
    fromName: sender.name,
    toEmail: recipient.email || config.mailboxEmail,
    subject: message.getSubject() || "",
    text: message.getPlainBody() || "",
    html: message.getBody() || "",
    receivedAt: message.getDate().toISOString(),
    extra: {
      provider: "gmail",
      providerThreadId: thread.getId(),
      providerMessageId: message.getId(),
      gmailThreadPermalink:
        "https://mail.google.com/mail/u/0/#inbox/" + thread.getId(),
    },
  };
}

function shouldImportMessage_(config, message) {
  var sender = parseAddress_(message.getFrom());
  if (!sender.email) return false;
  if (sender.email === config.mailboxEmail) return false;
  return !isBlockedSender_(sender.email, sender.name);
}

function isBlockedSender_(email, name) {
  var domain = email.split("@").pop() || "";
  for (var i = 0; i < BLOCKED_SENDER_DOMAINS.length; i++) {
    var blocked = BLOCKED_SENDER_DOMAINS[i];
    if (domain === blocked || domain.slice(-(blocked.length + 1)) === "." + blocked) {
      return true;
    }
  }

  var value = (email + " " + (name || "")).toLowerCase();
  for (var j = 0; j < BLOCKED_SENDER_PATTERNS.length; j++) {
    if (BLOCKED_SENDER_PATTERNS[j].test(value)) return true;
  }
  return false;
}

function parseAddress_(value) {
  if (!value) return { name: "", email: "" };
  var match = value.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (match) {
    return {
      name: (match[1] || "").trim(),
      email: (match[2] || "").trim().toLowerCase(),
    };
  }
  return { name: "", email: value.trim().toLowerCase() };
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function installTrigger_(functionName, minutes) {
  ScriptApp.newTrigger(functionName).timeBased().everyMinutes(minutes).create();
}

function validateConfig_(config) {
  if (!config.mailboxEmail || !config.webhookUrl || !config.webhookSecret) {
    throw new Error("mailboxEmail, webhookUrl, and webhookSecret must be configured.");
  }
  if (config.webhookSecret.indexOf("replace-with-") === 0) {
    throw new Error("Replace the webhookSecret placeholder before running.");
  }
  if (
    !config.processedLabelName ||
    !config.processedPropertyName ||
    !config.query
  ) {
    throw new Error(
      "processedLabelName, processedPropertyName, and query must be configured.",
    );
  }
}

function loadProcessedMessageIds_(propertyName) {
  var raw =
    PropertiesService.getScriptProperties().getProperty(propertyName) || "{}";
  try {
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveProcessedMessageIds_(propertyName, processed) {
  var entries = Object.keys(processed)
    .map(function (id) {
      return [id, processed[id]];
    })
    .sort(function (a, b) {
      return b[1] - a[1];
    })
    .slice(0, 300);

  var compact = {};
  for (var i = 0; i < entries.length; i++) {
    compact[entries[i][0]] = entries[i][1];
  }

  PropertiesService.getScriptProperties().setProperty(
    propertyName,
    JSON.stringify(compact),
  );
}
