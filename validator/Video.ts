import z from 'zod';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_VIDEO_TYPES = [
  'video/mp4',
];

export const zodVideo = z
  .any()
  .refine((file) => file?.size <= MAX_FILE_SIZE, 'Max video size is 5MB')
  .refine(
    (file) => ACCEPTED_VIDEO_TYPES.includes(file.mimetype),
    'Only .mp4 formats are supported.'
  );
