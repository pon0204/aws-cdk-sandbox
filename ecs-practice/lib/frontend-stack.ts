import { Stack, StackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_servicediscovery as servicediscovery,
  aws_iam as iam,
  aws_logs as logs,
  aws_elasticloadbalancingv2 as elb,
} from 'aws-cdk-lib'

interface frontendServiceStackProps extends StackProps {
  cluster: ecs.Cluster
  targetGroup: elb.ApplicationTargetGroup
  backendServiceName: string
  frontendSG: ec2.SecurityGroup
  frontendTaskRole: iam.Role
  frontendTaskExecutionRole: iam.Role
  frontendLogGroup: logs.LogGroup
  cloudmapNamespace: servicediscovery.PrivateDnsNamespace
}
export class FrontendServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: frontendServiceStackProps) {
    super(scope, id, props)

    const frontendTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'FrontendTaskDef',
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: props.frontendTaskExecutionRole,
        taskRole: props.frontendTaskRole,
      }
    )

    const frontendImage = new ecs.AssetImage('frontend')

    frontendTaskDefinition.addContainer('frontendContainer', {
      image: frontendImage,
      environment: {
        BACKEND_SERVICE_NAME: props.backendServiceName,
        SERVICE_DISCOVERY_ENDPOINT: props.cloudmapNamespace.namespaceName,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'my-stream',
        logGroup: props.frontendLogGroup,
      }),
      portMappings: [
        {
          containerPort: 80,
          hostPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
    })

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      cluster: props.cluster,
      desiredCount: 1,
      assignPublicIp: false,
      taskDefinition: frontendTaskDefinition,
      enableExecuteCommand: true,
      cloudMapOptions: {
        cloudMapNamespace: props.cloudmapNamespace,
        containerPort: 80,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
      },
      securityGroups: [props.frontendSG],
    })

    props.targetGroup.addTarget(frontendService)
  }
}
