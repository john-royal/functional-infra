import { z } from "zod";
import {
  createSubjects,
  type SubjectPayload,
} from "@openauthjs/openauth/subject";

export const subjects = createSubjects({
  user: z.object({
    id: z.string(),
    defaultTeamId: z.string(),
  }),
});

export type Subject = SubjectPayload<typeof subjects>;
