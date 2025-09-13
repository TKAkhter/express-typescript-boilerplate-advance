import { StatusCodes, ReasonPhrases } from "http-status-codes";

export const createResponse = ({
  data,
  message = ReasonPhrases.OK,
  status = StatusCodes.OK,
  success = true,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  message?: string;
  status?: number;
  success?: boolean;
}) => {
  return {
    success,
    statusCode: status,
    message,
    data,
  };
};
