# Welcome to your CDK TypeScript project

## EC2 の構築の勉強をする

[参考]

- https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html
- https://github.com/aws-samples/aws-cdk-examples/blob/master/typescript/ec2-instance/lib/ec2-cdk-stack.ts

import \* as ec2 from 'aws-cdk-lib/aws-ec2';

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
