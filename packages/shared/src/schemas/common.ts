import { z } from "zod";

export const idSchema = z.string().min(1);
export const timestampSchema = z.string().datetime();
export const jsonRecordSchema = z.record(z.string(), z.unknown());
