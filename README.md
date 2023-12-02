# ClamAV 1.2.1 with AWS Lambda Container Images for Node.js 20.x

CDK project for deploying a ClamAV 1.2.1 with AWS Lambda Container Images for Node.js 20.x

This helps you to scan files for viruses using AWS Lambda functions

🚨 Important:

- Virus definitions are updated during build
- Ensure you are building the container regularly to keep your definitions up to date
- You can update the Dockerfile to use a different version of ClamAV

![Diagram showing the example project: a s3 bucket with object created notification to lambda](https://res.cloudinary.com/practicaldev/image/fetch/s--XEsShymZ--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_800/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4fkzptasm0fd6emwq9v9.png)