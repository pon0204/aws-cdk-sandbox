import { Stack, StackProps, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_servicediscovery as servicediscovery,
  aws_iam as iam,
  aws_logs as logs,
} from 'aws-cdk-lib'

interface backendServiceStackProps extends StackProps {
  cluster: ecs.Cluster
  backendSG: ec2.SecurityGroup
  backendTaskRole: iam.Role
  backendTaskExecutionRole: iam.Role
  backendLogGroup: logs.LogGroup
  DDBTableName: string
  cloudmapNamespace: servicediscovery.PrivateDnsNamespace
}
export class BackendServiceStack extends Stack {
  public readonly backendServiceName: string
  constructor(scope: Construct, id: string, props: backendServiceStackProps) {
    super(scope, id, props)

    const backendTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'BackendTaskDef',
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: props.backendTaskExecutionRole,
        taskRole: props.backendTaskRole,
      }
    )

    const backendImage = new ecs.AssetImage('backend')

    backendTaskDefinition.addContainer('backendContainer', {
      image: backendImage,
      environment: {
        TODOTABLE_NAME: props.DDBTableName,
      },
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'my-stream',
        logGroup: props.backendLogGroup,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:10000/ishealthy || exit 1',
        ],
        interval: Duration.seconds(10),
        retries: 2,
        startPeriod: Duration.seconds(10),
        timeout: Duration.seconds(5),
      },
      portMappings: [
        {
          containerPort: 10000,
          hostPort: 10000,
          protocol: ecs.Protocol.TCP,
        },
      ],
    })

    this.backendServiceName = 'backend'

    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster: props.cluster,
      desiredCount: 1,
      assignPublicIp: false,
      taskDefinition: backendTaskDefinition,
      enableExecuteCommand: true,
      cloudMapOptions: {
        cloudMapNamespace: props.cloudmapNamespace,
        containerPort: 10000,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(10),
        name: this.backendServiceName,
      },
      securityGroups: [props.backendSG],
    })
  }
}
