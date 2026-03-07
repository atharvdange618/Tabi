import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.ts";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: env.CLOUDINARY_API_KEY.trim(),
  api_secret: env.CLOUDINARY_API_SECRET.trim(),
  secure: true,
});

export default cloudinary;
