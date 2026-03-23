import { NextResponse } from "next/server";
import type { ZodIssue } from "zod";

export function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}

export function accepted(message: string) {
  return NextResponse.json({ message }, { status: 202 });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(message: string, issues?: ZodIssue[]) {
  return NextResponse.json(
    {
      message,
      ...(issues?.length ? { issueCount: issues.length } : {})
    },
    { status: 400 }
  );
}

export function unauthorized(message: string) {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message: string) {
  return NextResponse.json({ message }, { status: 403 });
}

export function notFound(message: string) {
  return NextResponse.json({ message }, { status: 404 });
}

export function serverError(message = "Ocorreu um erro interno no servidor.") {
  return NextResponse.json({ message }, { status: 500 });
}
