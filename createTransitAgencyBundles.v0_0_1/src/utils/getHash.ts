import { ReadStream } from "fs";
import crypto from "crypto";

// https://stackoverflow.com/a/44643479/3970755
export default function getHash(stream: ReadStream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
