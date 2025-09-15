import { env } from "@/config/env";
import formData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(formData);

const options = {
  auth: {
    api_key: env.MAILGUN_API_KEY as string,
    domain: env.MAILGUN_DOMAIN as string,
  },
};

const mg = mailgun.client({ username: "api", key: options.auth.api_key }).messages;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendMail = async (mail: any) => mg.create(options.auth.domain, mail);
