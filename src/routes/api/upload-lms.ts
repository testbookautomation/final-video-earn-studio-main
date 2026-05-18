/**
 * POST /api/upload-lms
 *
 * Accepts a multipart/form-data body with:
 *   file          — video File blob
 *   submissionId  — client-generated submission ID (for event correlation)
 *   creatorPhone  — creator's phone number
 *   platform      — instagram | youtube | facebook
 *
 * Pipeline:
 *   1. video.upload.started
 *   2. LMS login → video.upload.lms_auth_success | lms_auth_failed
 *   3. Presigned URL → video.upload.presigned_url_ready | presigned_url_failed
 *   4. CDN upload → video.upload.cdn_transfer_started → cdn_transfer_success | cdn_transfer_failed
 *
 * Returns: { ok, cdnUrl, filename }
 */

import { createFileRoute } from "@tanstack/react-router";
import {
  EVENT, fireEvent,
  lmsLogin, lmsGetPresignedUrl, lmsUploadToPresignedUrl,
  cleanFileName, getFileExt,
} from "@/lib/lms";

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
        let originalFilename = "";

        try {
          const formData    = await request.formData();
          const file        = formData.get("file") as File | null;
          submissionId      = String(formData.get("submissionId") ?? "");
          creatorPhone      = String(formData.get("creatorPhone")  ?? "");
          const platform    = String(formData.get("platform")      ?? "");

          if (!file || file.size === 0) {
            return json({ ok: false, error: "No video file received." }, 400);
          }

          originalFilename       = file.name;
          const mimeType         = file.type || "video/mp4";
          const cleanFilename    = cleanFileName(originalFilename);
          const fileExt          = getFileExt(cleanFilename);
          const prefix           = `${Date.now()}-${cleanFilename}`;
          const fileSizeBytes    = file.size;
          const meta             = { creatorPhone, submissionId };

          /* ── 1. video.upload.started ───────────────────────────────── */
          await fireEvent(EVENT.VIDEO_UPLOAD_STARTED, {
            filename:       originalFilename,
            cleanFilename,
            mimeType,
            fileSizeBytes,
            platform,
          }, meta);

          /* ── 2. LMS authentication ─────────────────────────────────── */
          let token: string;
          try {
            token = await lmsLogin();
          } catch (err) {
            await fireEvent(EVENT.VIDEO_UPLOAD_LMS_AUTH_FAILED, {
              error: String(err),
            }, meta);
            return json({ ok: false, error: `LMS authentication failed: ${String(err)}` }, 502);
          }

          await fireEvent(EVENT.VIDEO_UPLOAD_LMS_AUTH_SUCCESS, {
            message: "LMS JWT token obtained successfully.",
          }, meta);

          /* ── 3. Get presigned upload URL ───────────────────────────── */
          let uploadUrl: string;
          let cdnUrl: string;
          try {
            ({ uploadUrl, cdnUrl } = await lmsGetPresignedUrl(token, prefix, fileExt));
          } catch (err) {
            await fireEvent(EVENT.VIDEO_UPLOAD_PRESIGNED_URL_FAILED, {
              error: String(err),
            }, meta);
            return json({ ok: false, error: `Failed to get presigned URL: ${String(err)}` }, 502);
          }

          await fireEvent(EVENT.VIDEO_UPLOAD_PRESIGNED_URL_READY, {
            cdnUrl,
            prefix,
            fileExt,
            message: "Presigned upload URL obtained. Ready to transfer file to CDN.",
          }, meta);

          /* ── 4. Upload file to CDN ─────────────────────────────────── */
          await fireEvent(EVENT.VIDEO_UPLOAD_CDN_TRANSFER_STARTED, {
            cdnUrl,
            fileSizeBytes,
            mimeType,
            // strip signed query params — they contain secrets
            uploadEndpoint: uploadUrl.split("?")[0],
          }, meta);

          const fileBuffer = await file.arrayBuffer();
          let statusCode: number;
          let responseText: string;

          try {
            ({ statusCode, responseText } = await lmsUploadToPresignedUrl(
              uploadUrl, fileBuffer, cleanFilename, mimeType,
            ));
          } catch (err) {
            await fireEvent(EVENT.VIDEO_UPLOAD_CDN_TRANSFER_FAILED, {
              error: String(err),
              cdnUrl,
            }, meta);
            return json({ ok: false, error: `CDN transfer error: ${String(err)}` }, 502);
          }

          const uploadSuccess = [200, 201, 204].includes(statusCode);

          if (uploadSuccess) {
            await fireEvent(EVENT.VIDEO_UPLOAD_CDN_TRANSFER_SUCCESS, {
              cdnUrl,
              filename:       cleanFilename,
              fileSizeBytes,
              httpStatus:     statusCode,
              message:        "Video file successfully uploaded to LMS CDN.",
            }, meta);

            return json({ ok: true, cdnUrl, filename: cleanFilename });
          } else {
            await fireEvent(EVENT.VIDEO_UPLOAD_CDN_TRANSFER_FAILED, {
              httpStatus:   statusCode,
              responseText: responseText.slice(0, 500),
              cdnUrl,
              message:      "CDN returned a non-success status code.",
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
          await fireEvent(EVENT.VIDEO_UPLOAD_PIPELINE_ERROR, {
            error:    String(err),
            filename: originalFilename,
          }, { creatorPhone, submissionId });

          return json({ ok: false, error: String(err) }, 500);
        }
      },
    },
  },
});
