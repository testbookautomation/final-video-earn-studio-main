/**
 * POST /api/upload-lms
 *
 * Accepts a multipart/form-data body with:
 *   file          — video File blob
 *   submissionId  — client-generated submission ID (for event correlation)
 *   creatorPhone  — creator's phone number
 *   creatorUserId — creator's Testbook user ID
 *   sessionId     — browser session ID
 *   platform      — instagram | youtube
 *
 * Emits only final, relevant events:
 *   UGC_creators_video_upload_completed
 *   UGC_creators_video_upload_failed
 *
 * Returns: { ok, cdnUrl, filename }
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  EVENT, fireEvent,
  lmsLogin, lmsGetPresignedUrl, lmsUploadToPresignedUrl,
  cleanFileName, getFileExt,
} from "@/lib/lms";
import {
  ACCEPTED_VIDEO_EXTENSIONS,
  MAX_VIDEO_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_LABEL,
  isAcceptedVideoFile,
} from "@/lib/upload-limits";

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

export const Route = createFileRoute("/api/upload-lms")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      POST: async ({ request }) => {
        let submissionId = "";
        let creatorPhone = "";
        let creatorUserId = "";
        let sessionId = "";
        let originalFilename = "";

        try {
          const formData    = await request.formData();
          const file        = formData.get("file") as File | null;
          submissionId      = String(formData.get("submissionId") ?? "");
          creatorPhone      = String(formData.get("creatorPhone")  ?? "").replace(/\D/g, "").slice(-10);
          creatorUserId     = String(formData.get("creatorUserId") ?? creatorPhone);
          sessionId         = String(formData.get("sessionId")     ?? "");
          const platform    = String(formData.get("platform")      ?? "");

          if (!file || file.size === 0) {
            return json({ ok: false, error: "No video file received." }, 400);
          }

          if (!isAcceptedVideoFile(file)) {
            return json({
              ok: false,
              error: `Please upload a video in ${ACCEPTED_VIDEO_EXTENSIONS} format.`,
            }, 400);
          }

          if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
            return json({
              ok: false,
              error: `Video is too large. Maximum upload size is ${MAX_VIDEO_UPLOAD_LABEL}.`,
            }, 413);
          }

          originalFilename       = file.name;
          const mimeType         = file.type || "video/mp4";
          const cleanFilename    = cleanFileName(originalFilename);
          const fileExt          = getFileExt(cleanFilename);
          const prefix           = `${Date.now()}-${cleanFilename}`;
          const fileSizeBytes    = file.size;
          const meta             = { creatorPhone, userId: creatorUserId, sessionId, submissionId };

          let token: string;
          try {
            token = await lmsLogin();
          } catch (err) {
            await fireEvent(EVENT.VIDEO_UPLOAD_FAILED, {
              reason: "lms_auth_failed",
              error: String(err),
              filename: originalFilename,
              fileSizeBytes,
              platform,
            }, meta);
            return json({ ok: false, error: `LMS authentication failed: ${String(err)}` }, 502);
          }

          let uploadUrl: string;
          let cdnUrl: string;
          try {
            ({ uploadUrl, cdnUrl } = await lmsGetPresignedUrl(token, prefix, fileExt));
          } catch (err) {
            await fireEvent(EVENT.VIDEO_UPLOAD_FAILED, {
              reason: "presigned_url_failed",
              error: String(err),
              filename: originalFilename,
              fileSizeBytes,
              platform,
            }, meta);
            return json({ ok: false, error: `Failed to get presigned URL: ${String(err)}` }, 502);
          }

          let statusCode: number;
          let responseText: string;

          try {
            ({ statusCode, responseText } = await lmsUploadToPresignedUrl(
              uploadUrl, file, cleanFilename, mimeType,
            ));
          } catch (err) {
            await fireEvent(EVENT.VIDEO_UPLOAD_FAILED, {
              reason: "cdn_transfer_failed",
              error: String(err),
              cdnUrl,
              filename: cleanFilename,
              fileSizeBytes,
              platform,
            }, meta);
            return json({ ok: false, error: `CDN transfer error: ${String(err)}` }, 502);
          }

          const uploadSuccess = [200, 201, 204].includes(statusCode);

          if (uploadSuccess) {
            await fireEvent(EVENT.VIDEO_UPLOAD_COMPLETED, {
              cdnUrl,
              filename:       cleanFilename,
              fileSizeBytes,
              httpStatus:     statusCode,
              platform,
            }, meta);

            return json({ ok: true, cdnUrl, filename: cleanFilename });
          } else {
            await fireEvent(EVENT.VIDEO_UPLOAD_FAILED, {
              reason: "cdn_rejected_upload",
              httpStatus:   statusCode,
              responseText: responseText.slice(0, 500),
              cdnUrl,
              filename: cleanFilename,
              fileSizeBytes,
              platform,
            }, meta);

            return json({
              ok: false,
              error: `CDN upload returned HTTP ${statusCode}.`,
              cdnUrl,       // still return it — URL is valid even if upload failed
              filename: cleanFilename,
            }, 502);
          }

        } catch (err) {
          /* Catch-all for unexpected errors */
          await fireEvent(EVENT.VIDEO_UPLOAD_FAILED, {
            reason: "unexpected_error",
            error:    String(err),
            filename: originalFilename,
          }, { creatorPhone, userId: creatorUserId, sessionId, submissionId });

          return json({ ok: false, error: String(err) }, 500);
        }
      },
    },
  },
});
