import { S3CreateEvent } from "aws-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { spawnSync } from "node:child_process";
import { mkdir, writeFile, unlink } from "node:fs/promises";

const s3Client = await new S3Client({});

//
// directories for clamscan
// "/tmp/files_to_scan" where we will store the files from s3 to scan
// "/tmp/clamscan_tmp" required by clamscan to store temporary files during the virus scan
//
await mkdir("/tmp/files_to_scan", { recursive: true });
await mkdir("/tmp/clamscan_tmp", { recursive: true });

async function handler(event: S3CreateEvent) {
  console.log(JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const s3Object = await s3Client.send(getObjectCommand);
    const s3ObjectContent = (await s3Object.Body?.transformToString()) as string;

    const tmpFilePath = `/tmp/files_to_scan/${objectKey}`;
    await writeFile(tmpFilePath, s3ObjectContent, { encoding: "utf-8" });

    //
    // clamscan CLI documentation:
    // https://linux.die.net/man/1/clamscan
    //
    const clamavScan = spawnSync(
      "clamscan",
      ["--verbose", "--stdout", `--database=/var/task/lib/database`, `--tempdir=/tmp/clamscan_tmp`, tmpFilePath],
      {
        encoding: "utf-8",
        stdio: "pipe",
      },
    );
    console.log(JSON.stringify(clamavScan, null, 2));

    // You can find the return codes here:
    // https://linux.die.net/man/1/clamscan
    if (clamavScan.status === 0) {
      console.log("no virus found");
    } else if (clamavScan.status === 1) {
      console.log("virus found");
    } else if (clamavScan.status === 2) {
      console.log("some error(s) occured in clamscan");
    }

    await unlink(tmpFilePath);
  }
}

export { handler };
