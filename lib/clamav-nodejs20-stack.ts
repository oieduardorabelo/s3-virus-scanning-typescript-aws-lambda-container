import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class ClamavNodejs20Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const clamavScan = new cdk.aws_lambda.DockerImageFunction(this, "clamavScan", {
      architecture: cdk.aws_lambda.Architecture.X86_64,
      code: cdk.aws_lambda.DockerImageCode.fromImageAsset("functions/clamav-scan", {
        target: "runtime",
      }),
      environment: {
        AWS_ACCOUNT_ID: cdk.Aws.ACCOUNT_ID,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        NODE_OPTIONS: "--enable-source-maps",
      },
      ephemeralStorageSize: cdk.Size.gibibytes(1),
      memorySize: 2048,
      timeout: cdk.Duration.minutes(5),
    });

    const s3Bucket = new cdk.aws_s3.Bucket(this, "s3Bucket", {});
    s3Bucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(clamavScan),
    );
    s3Bucket.grantReadWrite(clamavScan);
  }
}
