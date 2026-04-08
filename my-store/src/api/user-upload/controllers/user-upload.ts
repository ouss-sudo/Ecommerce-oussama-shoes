import fs from 'fs';
import path from 'path';

export default {
  async upload(ctx) {
    // Check user is authenticated
    if (!ctx.state.user) {
      return ctx.unauthorized('You must be logged in to upload.');
    }

    try {
      const file = ctx.request.files?.files;
      if (!file) {
        return ctx.badRequest('No file provided. Use form-data with key "files".');
      }

      const singleFile = Array.isArray(file) ? file[0] : file;

      // Destination: Strapi's public/uploads folder
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const ext = path.extname(singleFile.originalFilename || singleFile.name || '.jpg');
      const uniqueName = `avatar_${ctx.state.user.id}_${Date.now()}${ext}`;
      const destPath = path.join(uploadsDir, uniqueName);

      // Copy file (avoids Windows EPERM rename/unlink issues)
      const srcBuffer = fs.readFileSync(singleFile.filepath || singleFile.path);
      fs.writeFileSync(destPath, srcBuffer);

      // Try to clean up temp file gracefully (don't fail if we can't)
      try {
        fs.unlinkSync(singleFile.filepath || singleFile.path);
      } catch (_) {
        // Windows may block this - that's OK, temp files get cleaned up eventually
      }

      // Get file size
      const stats = fs.statSync(destPath);
      const fileSize = stats.size;

      // Insert a record into Strapi's files table directly
      const now = new Date().toISOString();
      const docId = Math.random().toString(36).substring(2, 26);
      const fileUrl = `/uploads/${uniqueName}`;
      const mimeType = singleFile.mimetype || singleFile.type || 'image/jpeg';
      const originalName = (singleFile.originalFilename || singleFile.name || uniqueName).replace(/[^a-zA-Z0-9._-]/g, '_');

      const result = await strapi.db.query('plugin::upload.file').create({
        data: {
          documentId: docId,
          name: originalName,
          alternativeText: null,
          caption: null,
          width: null,
          height: null,
          formats: null,
          hash: uniqueName.replace(ext, ''),
          ext: ext,
          mime: mimeType,
          size: Math.round(fileSize / 1024 * 100) / 100,
          url: fileUrl,
          previewUrl: null,
          provider: 'local',
          provider_metadata: null,
          createdAt: now,
          updatedAt: now,
          publishedAt: now,
        },
      });

      ctx.body = [result];

    } catch (err) {
      strapi.log.error('User upload error:', err);
      return ctx.badRequest('Upload failed: ' + err.message);
    }
  },
};
