## 実現したいこと

on のインフラ構築を aws-cdk で完全自動目指す。

## 実装内容

- RDS
- S3
- Cognito
- Elastic cache
- system manager
- Code deploy
- ECR
- EC2
- ECS(Fargate)

## Welcome to your CDK TypeScript project

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
