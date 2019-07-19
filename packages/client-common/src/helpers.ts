import * as crypto from "crypto";

export const helpers = {
  encryptPassword(str: string): string {
    return crypto.createHmac("sha256", process.env.PASSWORD_KEY!)
      .update(str)
      .digest("hex");
  }
};