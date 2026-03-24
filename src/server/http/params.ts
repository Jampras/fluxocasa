import { UserFacingError } from "./errors";

export function readStringParam(value: string | string[] | undefined, name: string) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && value[0]) {
    return value[0];
  }

  throw new UserFacingError(`Parametro ${name} ausente ou invalido.`);
}
