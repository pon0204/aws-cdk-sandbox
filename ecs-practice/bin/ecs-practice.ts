#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { InfrastructureStack } from '../lib/infrastruture-stack'
import { BackendServiceStack } from '../lib/backend-stack'
import { FrontendServiceStack } from '../lib/frontend-stack'

const app = new cdk.App()
const infra = new InfrastructureStack(app, 'InfrastructureStack', {
  env: { region: 'ap-northeast-1' },
})

const backendService = new BackendServiceStack(app, 'ECSBackendServiceStack', {
  env: { region: 'ap-northeast-1' },
  cluster: infra.cluster,
  backendSG: infra.backendServiceSG,
  backendTaskRole: infra.backendTaskRole,
  backendTaskExecutionRole: infra.TaskExecutionRole,
  backendLogGroup: infra.backendLogGroup,
  DDBTableName: infra.DDBTableName,
  cloudmapNamespace: infra.cloudmapNamespace,
})

backendService.addDependency(infra)

const frontendService = new FrontendServiceStack(
  app,
  'ECSFrontendServiceStack',
  {
    env: { region: 'ap-northeast-1' },
    vpc: infra.vpc,
    cluster: infra.cluster,
    backendServiceName: backendService.backendServiceName,
    frontendSG: infra.frontendServiceSG,
    targetGroup: infra.targetGroup,
    frontendTaskRole: infra.frontendTaskRole,
    frontendTaskExecutionRole: infra.TaskExecutionRole,
    frontendLogGroup: infra.frontendLogGroup,
    cloudmapNamespace: infra.cloudmapNamespace,
  }
)
frontendService.addDependency(backendService)
