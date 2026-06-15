import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: "dtdseqzpv",
  api_key: "954365594715315",
  api_secret: "ZKryn_IIcks11tIYTCquql2zgiA"
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "nortecrm_propiedades",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "heic"]
  }
});

export const upload = multer({ storage: storage });
