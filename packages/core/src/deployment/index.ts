import { createId } from "@paralleldrive/cuid2";
import { schema, useTransaction } from "../db";
import type { NewDeployment } from "../db/schema";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

const sqs = new SQSClient();

export namespace Deployment {
  export async function create(input: Omit<NewDeployment, "id">) {
    const id = createId();
    await useTransaction(async (tx) => {
      await tx.insert(schema.deployments).values({
        id,
        ...input,
      });
    });
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: Resource.DeployQueue.url,
        MessageBody: JSON.stringify({
          id,
        }),
      }),
    );
    return id;
  }
}
