import {
  type SubjectPayload,
  createSubjects,
} from "@openauthjs/openauth/subject";
import { z } from "zod";

export const subjects = createSubjects({
  user: z.object({
    id: z.string(),
    defaultTeamId: z.string(),
  }),
});

export type Subject = SubjectPayload<typeof subjects>;
